import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { format } from 'date-fns';
import ConceptReviewCard from './ConceptReviewCard';

export default function TodayConceptReviews({ onReviewed }) {
    const [concepts, setConcepts] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchDueConcepts = async () => {
        setLoading(true);
        const today = format(new Date(), 'yyyy-MM-dd');
        const { data, error } = await supabase
            .from('concepts')
            .select('*')
            .lte('next_review_date', today)
            .order('strength_status', { ascending: true })
            .order('next_review_date', { ascending: true });

        if (error) {
            console.error('Error fetching concept reviews:', error.message);
        } else {
            setConcepts(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchDueConcepts();
    }, []);

    const handleReviewed = () => {
        fetchDueConcepts();
        if (onReviewed) onReviewed();
    };

    if (loading) {
        return <div className="section-loading">Loading today's concept reviews...</div>;
    }

    if (concepts.length === 0) {
        return (
            <div className="empty-state">
                <div className="empty-icon">🎉</div>
                <h3>All caught up!</h3>
                <p>No concepts to review today. Great job!</p>
            </div>
        );
    }

    return (
        <div className="today-reviews">
            <div className="section-header">
                <h3>Today's Concept Reviews</h3>
                <span className="badge">{concepts.length} due</span>
            </div>
            <div className="review-cards-grid">
                {concepts.map((concept) => (
                    <ConceptReviewCard
                        key={concept.id}
                        concept={concept}
                        onReviewed={handleReviewed}
                    />
                ))}
            </div>
        </div>
    );
}
