import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import ReviewCard from './ReviewCard';
import {
    getDailyReviewQueue,
    fetchDailyLimit,
    estimateReviewTime,
    getStrengthClass,
    DEFAULT_DAILY_LIMIT,
} from '../lib/reviewEngine';

export default function TodayReviews({ onReviewed }) {
    const { user } = useAuth();
    const [allDueProblems, setAllDueProblems] = useState([]);
    const [queuedProblems, setQueuedProblems] = useState([]);
    const [dailyLimit, setDailyLimit] = useState(DEFAULT_DAILY_LIMIT);
    const [completedCount, setCompletedCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchDueProblems = async () => {
        setLoading(true);

        // Fetch daily limit from Supabase
        let limit = DEFAULT_DAILY_LIMIT;
        if (user) {
            limit = await fetchDailyLimit(supabase, user.id);
        }
        setDailyLimit(limit);

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

            // Apply priority scoring and daily limit
            const queue = getDailyReviewQueue(due, limit);
            setQueuedProblems(queue);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchDueProblems();
    }, []);

    const handleReviewed = () => {
        setCompletedCount((c) => c + 1);
        fetchDueProblems();
        if (onReviewed) onReviewed();
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
        ? Math.round((completedCount / reviewsInQueue) * 100)
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
                <div className="mission-title">
                    🎯 Today's Mission
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
