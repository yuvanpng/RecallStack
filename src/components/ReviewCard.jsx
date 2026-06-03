import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { addDays, format } from 'date-fns';
import {
    calculateNextReview,
    updatePatternConfidence,
    getStrengthClass,
    getRatingDisplay,
    INTERVALS,
} from '../lib/reviewEngine';

export default function ReviewCard({ problem, onReviewed }) {
    const [showNotes, setShowNotes] = useState(false);
    const [loading, setLoading] = useState(false);
    const [reviewed, setReviewed] = useState(false);
    const [completing, setCompleting] = useState(false);

    const handleReview = async (rating) => {
        setLoading(true);
        try {
            const { nextIntervalDays, nextStage } = calculateNextReview(
                rating,
                problem.review_stage || 0
            );

            const today = new Date();
            const nextReview = addDays(today, nextIntervalDays);

            // Update the problem
            const { error: updateError } = await supabase
                .from('problems')
                .update({
                    interval_days: nextIntervalDays,
                    next_review_date: format(nextReview, 'yyyy-MM-dd'),
                    strength_status: rating,
                    review_count: problem.review_count + 1,
                    review_stage: nextStage,
                })
                .eq('id', problem.id);

            if (updateError) throw updateError;

            // Insert review record
            const { error: insertError } = await supabase.from('reviews').insert({
                problem_id: problem.id,
                review_date: format(today, 'yyyy-MM-dd'),
                recall_quality: rating,
                next_interval_days: nextIntervalDays,
            });

            if (insertError) throw insertError;

            // Update pattern confidence
            await updatePatternConfidence(supabase, problem.id, rating);

            // Animate out, then mark reviewed
            setCompleting(true);
            setTimeout(() => {
                setReviewed(true);
                if (onReviewed) onReviewed();
            }, 350);
        } catch (err) {
            console.error('Review error:', err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleArchive = async () => {
        setLoading(true);
        try {
            const { error } = await supabase
                .from('problems')
                .update({ is_archived: true })
                .eq('id', problem.id);

            if (error) throw error;

            setCompleting(true);
            setTimeout(() => {
                setReviewed(true);
                if (onReviewed) onReviewed();
            }, 350);
        } catch (err) {
            console.error('Archive error:', err.message);
        } finally {
            setLoading(false);
        }
    };

    if (reviewed) {
        return (
            <div className="review-card reviewed">
                <div className="review-card-done">✓ Reviewed</div>
            </div>
        );
    }

    const strengthClass = getStrengthClass(problem.strength_status);
    const currentStage = problem.review_stage || 0;

    return (
        <div className={`review-card strength-${strengthClass} ${completing ? 'completing' : ''}`}>
            <div className="review-card-header">
                <h4>{problem.title}</h4>
                <span className={`difficulty-badge diff-${problem.difficulty.toLowerCase()}`}>
                    {problem.difficulty}
                </span>
            </div>

            <div className="review-card-meta">
                <span className="platform-badge">{problem.platform}</span>
                <span className={`strength-badge strength-${strengthClass}`}>
                    {getRatingDisplay(problem.strength_status).label}
                </span>
                <span className="review-count">Stage {currentStage} · Reviews: {problem.review_count}</span>
            </div>

            {problem.tags && problem.tags.length > 0 && (
                <div className="review-card-tags">
                    {problem.tags.map((tag) => (
                        <span key={tag} className="tag-small">{tag}</span>
                    ))}
                </div>
            )}

            {!showNotes ? (
                <button
                    className="btn btn-ghost btn-show-notes"
                    onClick={() => setShowNotes(true)}
                >
                    👁 Show Notes
                </button>
            ) : (
                <div className="review-card-notes">
                    <p>{problem.notes || 'No notes recorded.'}</p>
                </div>
            )}

            <div className="review-actions">
                <button
                    className="btn btn-easy-recall"
                    onClick={() => handleReview('Easy Recall')}
                    disabled={loading}
                    title={`Next: +${INTERVALS['Easy Recall'][currentStage]}d`}
                >
                    ✅ Easy Recall
                </button>
                <button
                    className="btn btn-hard-recall"
                    onClick={() => handleReview('Hard Recall')}
                    disabled={loading}
                    title={`Next: +${INTERVALS['Hard Recall'][currentStage]}d`}
                >
                    🧠 Hard Recall
                </button>
                <button
                    className="btn btn-forgot"
                    onClick={() => handleReview('Forgot Completely')}
                    disabled={loading}
                    title={`Next: +${INTERVALS['Forgot Completely'][0]}d`}
                >
                    ❌ Forgot
                </button>
            </div>

            <div className="review-actions" style={{ marginTop: '0.4rem' }}>
                <button
                    className="btn btn-archive"
                    onClick={handleArchive}
                    disabled={loading}
                >
                    📦 Archive
                </button>
            </div>
        </div>
    );
}
