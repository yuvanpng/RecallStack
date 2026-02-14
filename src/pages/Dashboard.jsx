import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { format, differenceInCalendarDays, subDays, parseISO } from 'date-fns';
import Navbar from '../components/Navbar';
import StatsBar from '../components/StatsBar';
import TodayReviews from '../components/TodayReviews';
import AddProblemForm from '../components/AddProblemForm';
import AllProblems from '../components/AllProblems';
import UpcomingCalendar from '../components/UpcomingCalendar';
import Heatmap from '../components/Heatmap';

const TABS = [
    { id: 'reviews', label: "Today's Reviews" },
    { id: 'add', label: 'Add Problem' },
    { id: 'all', label: 'All Problems' },
    { id: 'upcoming', label: 'Upcoming' },
];

export default function Dashboard() {
    const [activeTab, setActiveTab] = useState('reviews');
    const [problems, setProblems] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [pendingCount, setPendingCount] = useState(0);
    const [streak, setStreak] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);

        // Fetch all problems
        const { data: problemsData } = await supabase
            .from('problems')
            .select('*')
            .order('created_at', { ascending: false });

        // Fetch all reviews
        const { data: reviewsData } = await supabase
            .from('reviews')
            .select('*')
            .order('review_date', { ascending: false });

        const probs = problemsData || [];
        const revs = reviewsData || [];

        setProblems(probs);
        setReviews(revs);

        // Calculate pending count
        const today = format(new Date(), 'yyyy-MM-dd');
        const pending = probs.filter((p) => p.next_review_date <= today).length;
        setPendingCount(pending);

        // Calculate streak
        setStreak(calculateStreak(revs));

        setLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const calculateStreak = (revs) => {
        if (revs.length === 0) return 0;

        const uniqueDates = [...new Set(revs.map((r) => r.review_date))].sort().reverse();
        if (uniqueDates.length === 0) return 0;

        const today = format(new Date(), 'yyyy-MM-dd');
        const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');

        // Streak must include today or yesterday
        if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) return 0;

        let currentStreak = 1;
        for (let i = 1; i < uniqueDates.length; i++) {
            const diff = differenceInCalendarDays(
                parseISO(uniqueDates[i - 1]),
                parseISO(uniqueDates[i])
            );
            if (diff === 1) {
                currentStreak++;
            } else {
                break;
            }
        }

        return currentStreak;
    };

    if (loading) {
        return <div className="loading-screen">Loading dashboard...</div>;
    }

    return (
        <div className="dashboard">
            <Navbar pendingCount={pendingCount} section="dsa" />

            <div className="dashboard-content">
                <StatsBar problems={problems} streak={streak} />

                <div className="tab-bar">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.label}
                            {tab.id === 'reviews' && pendingCount > 0 && (
                                <span className="tab-badge">{pendingCount}</span>
                            )}
                        </button>
                    ))}
                </div>

                <div className="tab-content">
                    {activeTab === 'reviews' && (
                        <TodayReviews onReviewed={fetchData} />
                    )}
                    {activeTab === 'add' && (
                        <AddProblemForm onProblemAdded={fetchData} />
                    )}
                    {activeTab === 'all' && (
                        <AllProblems problems={problems} onDataChanged={fetchData} />
                    )}
                    {activeTab === 'upcoming' && (
                        <UpcomingCalendar problems={problems} />
                    )}
                </div>

                <Heatmap reviews={reviews} />
            </div>
        </div>
    );
}
