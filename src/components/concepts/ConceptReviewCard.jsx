import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { addDays, format } from 'date-fns';

export default function ConceptReviewCard({ concept, onReviewed }) {
    const [showNotes, setShowNotes] = useState(false);
    const [loading, setLoading] = useState(false);
    const [reviewed, setReviewed] = useState(false);

    const handleReview = async (quality) => {
        setLoading(true);
        try {
            let newInterval;
            let newStrength;

            if (quality === 'Strong') {
                newInterval = concept.interval_days * 2;
                newStrength = 'Strong';
            } else if (quality === 'Medium') {
                newInterval = Math.round(concept.interval_days * 1.5);
                newStrength = 'Medium';
            } else {
                newInterval = 4;
                newStrength = 'Weak';
            }

            const today = new Date();
            const nextReview = addDays(today, newInterval);

            const { error: updateError } = await supabase
                .from('concepts')
                .update({
                    interval_days: newInterval,
                    next_review_date: format(nextReview, 'yyyy-MM-dd'),
                    strength_status: newStrength,
                    review_count: concept.review_count + 1,
                })
                .eq('id', concept.id);

            if (updateError) throw updateError;

            const { error: insertError } = await supabase.from('concept_reviews').insert({
                concept_id: concept.id,
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
        <div className={`review-card strength-${concept.strength_status.toLowerCase()}`}>
            <div className="review-card-header">
                <h4>{concept.title}</h4>
                <span className="subject-badge">{concept.subject}</span>
            </div>

            <div className="review-card-meta">
                {concept.topic && <span className="platform-badge">{concept.topic}</span>}
                <span className={`strength-badge strength-${concept.strength_status.toLowerCase()}`}>
                    {concept.strength_status}
                </span>
                <span className="review-count">Reviews: {concept.review_count}</span>
            </div>

            {!showNotes ? (
                <button
                    className="btn btn-ghost btn-show-notes"
                    onClick={() => setShowNotes(true)}
                >
                    👁 Show Notes
                </button>
            ) : (
                <div className="review-card-notes">
                    <p>{concept.notes || 'No notes recorded.'}</p>
                </div>
            )}

            <div className="review-actions">
                <button className="btn btn-strong" onClick={() => handleReview('Strong')} disabled={loading}>
                    💪 Strong
                </button>
                <button className="btn btn-medium" onClick={() => handleReview('Medium')} disabled={loading}>
                    🤔 Medium
                </button>
                <button className="btn btn-weak" onClick={() => handleReview('Weak')} disabled={loading}>
                    😓 Weak
                </button>
            </div>
        </div>
    );
}
