import { differenceInCalendarDays, format } from 'date-fns';

// ============================================================
// SPACED REPETITION INTERVALS (stage-based)
// ============================================================

export const INTERVALS = {
    'Easy Recall': [3, 7, 21, 60, 120],
    'Hard Recall': [1, 3, 7, 14, 30],
    'Forgot Completely': [1, 1, 3, 7, 14],
};

export const MAX_STAGE = 4;

/**
 * Calculate the next review date and stage based on rating.
 * @param {string} rating - 'Easy Recall' | 'Hard Recall' | 'Forgot Completely'
 * @param {number} currentStage - Current review stage (0-4)
 * @returns {{ nextIntervalDays: number, nextStage: number }}
 */
export function calculateNextReview(rating, currentStage) {
    const stage = Math.min(Math.max(currentStage || 0, 0), MAX_STAGE);

    if (rating === 'Easy Recall') {
        const interval = INTERVALS['Easy Recall'][stage];
        return {
            nextIntervalDays: interval,
            nextStage: Math.min(stage + 1, MAX_STAGE),
        };
    }

    if (rating === 'Hard Recall') {
        const interval = INTERVALS['Hard Recall'][stage];
        return {
            nextIntervalDays: interval,
            nextStage: stage, // stays the same
        };
    }

    // Forgot Completely — reset to stage 0
    const interval = INTERVALS['Forgot Completely'][0];
    return {
        nextIntervalDays: interval,
        nextStage: 0,
    };
}

// ============================================================
// PRIORITY SCORING
// ============================================================

const STRENGTH_WEIGHTS = {
    'Forgot Completely': 100,
    'Hard Recall': 50,
    'Easy Recall': 10,
};

const DIFFICULTY_WEIGHTS = {
    Easy: 10,
    Medium: 20,
    Hard: 30,
};

/**
 * Calculate priority score for a due problem.
 * Higher score = should be reviewed first.
 * @param {object} problem
 * @returns {number}
 */
export function calculatePriorityScore(problem) {
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');

    const strengthWeight = STRENGTH_WEIGHTS[problem.strength_status] || 50;
    const difficultyWeight = DIFFICULTY_WEIGHTS[problem.difficulty] || 20;

    let overdueDays = 0;
    if (problem.next_review_date && problem.next_review_date < todayStr) {
        const reviewDate = new Date(problem.next_review_date + 'T00:00:00');
        overdueDays = differenceInCalendarDays(today, reviewDate);
    }

    return strengthWeight + difficultyWeight + overdueDays;
}

/**
 * Sort due problems by priority and return top N.
 * @param {object[]} dueProblems - All due (non-archived) problems
 * @param {number} limit - Daily review limit
 * @returns {object[]}
 */
export function getDailyReviewQueue(dueProblems, limit) {
    const scored = dueProblems.map((p) => ({
        ...p,
        _priorityScore: calculatePriorityScore(p),
    }));

    scored.sort((a, b) => b._priorityScore - a._priorityScore);

    return scored.slice(0, limit);
}

// ============================================================
// DAILY REVIEW LIMIT (Supabase-backed)
// ============================================================

export const DEFAULT_DAILY_LIMIT = 5;

/**
 * Fetch user's daily review limit from Supabase.
 * Creates a default row if none exists.
 * @param {object} supabase
 * @param {string} userId
 * @returns {Promise<number>}
 */
export async function fetchDailyLimit(supabase, userId) {
    const { data, error } = await supabase
        .from('user_settings')
        .select('daily_review_limit')
        .eq('user_id', userId)
        .single();

    if (error || !data) {
        // Create default settings row
        await supabase.from('user_settings').insert({
            user_id: userId,
            daily_review_limit: DEFAULT_DAILY_LIMIT,
        });
        return DEFAULT_DAILY_LIMIT;
    }

    return data.daily_review_limit;
}

/**
 * Update user's daily review limit in Supabase.
 * @param {object} supabase
 * @param {string} userId
 * @param {number} limit
 */
export async function updateDailyLimit(supabase, userId, limit) {
    const clampedLimit = Math.max(1, Math.min(50, limit));

    const { error } = await supabase
        .from('user_settings')
        .update({
            daily_review_limit: clampedLimit,
            updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

    if (error) {
        // Row might not exist yet — upsert
        await supabase.from('user_settings').upsert({
            user_id: userId,
            daily_review_limit: clampedLimit,
            updated_at: new Date().toISOString(),
        });
    }

    return clampedLimit;
}

// ============================================================
// PATTERN CONFIDENCE
// ============================================================

const CONFIDENCE_DELTAS = {
    'Easy Recall': 5,
    'Hard Recall': 1,
    'Forgot Completely': -8,
};

/**
 * Update confidence for all patterns linked to a problem after a review.
 * @param {object} supabase
 * @param {string} problemId
 * @param {string} rating - 'Easy Recall' | 'Hard Recall' | 'Forgot Completely'
 */
export async function updatePatternConfidence(supabase, problemId, rating) {
    const delta = CONFIDENCE_DELTAS[rating] || 0;
    if (delta === 0) return;

    // Get all pattern IDs linked to this problem
    const { data: links } = await supabase
        .from('problem_patterns')
        .select('pattern_id')
        .eq('problem_id', problemId);

    if (!links || links.length === 0) return;

    const patternIds = links.map((l) => l.pattern_id);

    // Fetch current confidence values
    const { data: patterns } = await supabase
        .from('patterns')
        .select('id, confidence')
        .in('id', patternIds);

    if (!patterns) return;

    // Update each pattern's confidence
    for (const pattern of patterns) {
        const newConfidence = Math.max(0, Math.min(100, pattern.confidence + delta));
        await supabase
            .from('patterns')
            .update({ confidence: newConfidence })
            .eq('id', pattern.id);
    }
}

// ============================================================
// HELPERS
// ============================================================

/**
 * Estimate review time in minutes based on problem count.
 * Assumes ~4 mins per problem on average.
 */
export function estimateReviewTime(count) {
    return count * 4;
}

/**
 * Get display label and emoji for a rating.
 */
export function getRatingDisplay(rating) {
    switch (rating) {
        case 'Easy Recall':
            return { emoji: '✅', label: 'Easy Recall', shortLabel: 'Easy' };
        case 'Hard Recall':
            return { emoji: '🧠', label: 'Hard Recall', shortLabel: 'Hard' };
        case 'Forgot Completely':
            return { emoji: '❌', label: 'Forgot', shortLabel: 'Forgot' };
        default:
            return { emoji: '❓', label: rating, shortLabel: rating };
    }
}

/**
 * Get CSS class suffix for a strength status.
 */
export function getStrengthClass(status) {
    switch (status) {
        case 'Easy Recall':
            return 'easy-recall';
        case 'Hard Recall':
            return 'hard-recall';
        case 'Forgot Completely':
            return 'forgot';
        default:
            return 'unknown';
    }
}
