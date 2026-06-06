import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import ReviewCard from './ReviewCard';
import {
    getDailyReviewQueue,
    fetchDailyLimit,
    updateDailyLimit,
    estimateReviewTime,
    DEFAULT_DAILY_LIMIT,
} from '../lib/reviewEngine';

export default function TodayReviews({ onReviewed }) {
    const { user } = useAuth();
    const [allDueProblems, setAllDueProblems] = useState([]);
    const [queuedProblems, setQueuedProblems] = useState([]);
    const [completedCount, setCompletedCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [limit, setLimit] = useState(DEFAULT_DAILY_LIMIT);
    const [inputVal, setInputVal] = useState(DEFAULT_DAILY_LIMIT.toString());

    // Fetch due problems and saved limit on mount
    useEffect(() => {
        const init = async () => {
            setLoading(true);

            // Fetch saved limit from Supabase
            let savedLimit = DEFAULT_DAILY_LIMIT;
            if (user) {
                savedLimit = await fetchDailyLimit(supabase, user.id);
            }
            setLimit(savedLimit);
            setInputVal(savedLimit.toString());

            // Fetch due problems
            const today = format(new Date(), 'yyyy-MM-dd');
            const { data, error } = await supabase
                .from('problems')
                .select('*')
                .lte('next_review_date', today)
                .eq('is_archived', false)
                .order('next_review_date', { ascending: true });

            if (error) {
                console.error('Error fetching reviews:', error.message);
                setAllDueProblems([]);
                setQueuedProblems([]);
            } else {
                const due = data || [];
                setAllDueProblems(due);
                setQueuedProblems(getDailyReviewQueue(due, savedLimit));
            }
            setLoading(false);
        };
        init();
    }, [user]);

    // Recompute queue whenever limit changes (after initial load)
    useEffect(() => {
        if (!loading && allDueProblems.length > 0) {
            setQueuedProblems(getDailyReviewQueue(allDueProblems, limit));
        }
    }, [limit]);

    const refetchProblems = useCallback(async () => {
        const today = format(new Date(), 'yyyy-MM-dd');
        const { data } = await supabase
            .from('problems')
            .select('*')
            .lte('next_review_date', today)
            .eq('is_archived', false)
            .order('next_review_date', { ascending: true });

        const due = data || [];
        setAllDueProblems(due);
        setQueuedProblems(getDailyReviewQueue(due, limit));
    }, [limit]);

    const handleReviewed = () => {
        setCompletedCount((c) => c + 1);
        refetchProblems();
        if (onReviewed) onReviewed();
    };

    const handleGoalChange = (e) => {
        const raw = e.target.value;
        setInputVal(raw); // Always update what's shown in the input

        const parsed = parseInt(raw);
        if (!isNaN(parsed) && parsed >= 1 && parsed <= 50) {
            setLimit(parsed); // Instantly recompute queue via effect above

            // Persist to Supabase in the background
            if (user) {
                updateDailyLimit(supabase, user.id, parsed);
            }
        }
    };

    if (loading) {
        return <div className="section-loading">Loading today's mission...</div>;
    }

    const totalDue = allDueProblems.length;
    const reviewsInQueue = queuedProblems.length;
    const remaining = totalDue - reviewsInQueue;
    const estimatedTime = estimateReviewTime(reviewsInQueue);

    // Breakdown by strength
    const forgotCount = queuedProblems.filter((p) => p.strength_status === 'Forgot Completely').length;
    const hardCount = queuedProblems.filter((p) => p.strength_status === 'Hard Recall').length;
    const easyCount = queuedProblems.filter((p) => p.strength_status === 'Easy Recall').length;

    // Progress
    const progressPct = reviewsInQueue > 0
        ? Math.round((completedCount / (reviewsInQueue + completedCount)) * 100)
        : 0;

    if (totalDue === 0) {
        return (
            <div className="empty-state">
                <div className="empty-icon">🎉</div>
                <h3>All caught up!</h3>
                <p>No problems to review today. Great job!</p>
            </div>
        );
    }

    return (
        <div className="today-mission">
            {/* Mission Header */}
            <div className="mission-header">
                <div className="mission-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <span>🎯 Today's Mission</span>
                    <div style={{ fontSize: '0.9rem', fontWeight: 'normal', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <label htmlFor="daily-goal-input">Daily Goal:</label>
                        <input
                            id="daily-goal-input"
                            type="number"
                            min="1"
                            max="50"
                            value={inputVal}
                            onChange={handleGoalChange}
                            style={{
                                width: '60px',
                                padding: '0.3rem 0.4rem',
                                background: 'var(--bg-tertiary)',
                                border: '1px solid var(--border)',
                                borderRadius: 'var(--radius-sm)',
                                color: 'var(--text-primary)',
                                textAlign: 'center',
                                fontSize: '1rem',
                                fontWeight: '600',
                            }}
                        />
                    </div>
                </div>

                <div className="mission-breakdown">
                    {forgotCount > 0 && (
                        <div className="mission-breakdown-item forgot">
                            <span>⭐</span>
                            <span className="count">{forgotCount}</span>
                            <span>Forgot Reviews</span>
                        </div>
                    )}
                    {hardCount > 0 && (
                        <div className="mission-breakdown-item hard-recall">
                            <span>⭐</span>
                            <span className="count">{hardCount}</span>
                            <span>Hard Reviews</span>
                        </div>
                    )}
                    {easyCount > 0 && (
                        <div className="mission-breakdown-item easy-recall">
                            <span>⭐</span>
                            <span className="count">{easyCount}</span>
                            <span>Easy Reviews</span>
                        </div>
                    )}
                </div>

                <div className="mission-stats">
                    <span>📋 Total Reviews: <strong>{reviewsInQueue}</strong></span>
                    <span>⏱ Estimated Time: <strong>{estimatedTime} mins</strong></span>
                </div>

                {/* Progress bar */}
                {completedCount > 0 && (
                    <div className="mission-progress">
                        <div
                            className="mission-progress-fill"
                            style={{ width: `${Math.min(progressPct, 100)}%` }}
                        />
                    </div>
                )}

                {/* Queue info */}
                <div className="mission-queue-info">
                    <span className="mission-queue-pill">
                        ✅ {reviewsInQueue} Reviews Selected
                    </span>
                    {remaining > 0 && (
                        <span className="mission-queue-pill remaining">
                            📥 {remaining} Remaining in Queue
                        </span>
                    )}
                </div>
            </div>

            {/* Review Cards */}
            <div className="review-cards-grid">
                {queuedProblems.map((problem) => (
                    <ReviewCard
                        key={problem.id}
                        problem={problem}
                        onReviewed={handleReviewed}
                    />
                ))}
            </div>
        </div>
    );
}
