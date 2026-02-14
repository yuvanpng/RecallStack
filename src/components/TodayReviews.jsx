import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { format } from 'date-fns';
import ReviewCard from './ReviewCard';

export default function TodayReviews({ onReviewed }) {
    const [problems, setProblems] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchDueProblems = async () => {
        setLoading(true);
        const today = format(new Date(), 'yyyy-MM-dd');
        const { data, error } = await supabase
            .from('problems')
            .select('*')
            .lte('next_review_date', today)
            .order('strength_status', { ascending: true }) // Weak first
            .order('next_review_date', { ascending: true });

        if (error) {
            console.error('Error fetching reviews:', error.message);
        } else {
            setProblems(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchDueProblems();
    }, []);

    const handleReviewed = () => {
        fetchDueProblems();
        if (onReviewed) onReviewed();
    };

    if (loading) {
        return <div className="section-loading">Loading today's reviews...</div>;
    }

    if (problems.length === 0) {
        return (
            <div className="empty-state">
                <div className="empty-icon">🎉</div>
                <h3>All caught up!</h3>
                <p>No problems to review today. Great job!</p>
            </div>
        );
    }

    return (
        <div className="today-reviews">
            <div className="section-header">
                <h3>Today's Reviews</h3>
                <span className="badge">{problems.length} due</span>
            </div>
            <div className="review-cards-grid">
                {problems.map((problem) => (
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
