import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { addDays, format } from 'date-fns';

export default function ReviewCard({ problem, onReviewed }) {
    const [showNotes, setShowNotes] = useState(false);
    const [loading, setLoading] = useState(false);
    const [reviewed, setReviewed] = useState(false);

    const handleReview = async (quality) => {
        setLoading(true);
        try {
            let newInterval;
            let newStrength;

            if (quality === 'Strong') {
                newInterval = problem.interval_days * 2;
                newStrength = 'Strong';
            } else if (quality === 'Medium') {
                newInterval = Math.round(problem.interval_days * 1.5);
                newStrength = 'Medium';
            } else {
                newInterval = 4;
                newStrength = 'Weak';
            }

            const today = new Date();
            const nextReview = addDays(today, newInterval);

            // Update the problem
            const { error: updateError } = await supabase
                .from('problems')
                .update({
                    interval_days: newInterval,
                    next_review_date: format(nextReview, 'yyyy-MM-dd'),
                    strength_status: newStrength,
                    review_count: problem.review_count + 1,
                })
                .eq('id', problem.id);

            if (updateError) throw updateError;

            // Insert review record
            const { error: insertError } = await supabase.from('reviews').insert({
                problem_id: problem.id,
                review_date: format(today, 'yyyy-MM-dd'),
                recall_quality: quality,
                next_interval_days: newInterval,
            });

            if (insertError) throw insertError;

            setReviewed(true);
            if (onReviewed) onReviewed();
        } catch (err) {
            console.error('Review error:', err.message);
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

    return (
        <div className={`review-card strength-${problem.strength_status.toLowerCase()}`}>
            <div className="review-card-header">
                <h4>{problem.title}</h4>
                <span className={`difficulty-badge diff-${problem.difficulty.toLowerCase()}`}>
                    {problem.difficulty}
                </span>
            </div>

            <div className="review-card-meta">
                <span className="platform-badge">{problem.platform}</span>
                <span className={`strength-badge strength-${problem.strength_status.toLowerCase()}`}>
                    {problem.strength_status}
                </span>
                <span className="review-count">Reviews: {problem.review_count}</span>
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
                    className="btn btn-strong"
                    onClick={() => handleReview('Strong')}
                    disabled={loading}
                >
                    💪 Strong
                </button>
                <button
                    className="btn btn-medium"
                    onClick={() => handleReview('Medium')}
                    disabled={loading}
                >
                    🤔 Medium
                </button>
                <button
                    className="btn btn-weak"
                    onClick={() => handleReview('Weak')}
                    disabled={loading}
                >
                    😓 Weak
                </button>
            </div>
        </div>
    );
}
