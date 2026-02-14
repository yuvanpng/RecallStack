import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { format, differenceInCalendarDays, subDays, parseISO } from 'date-fns';
import Navbar from '../components/Navbar';
import ConceptStatsBar from '../components/concepts/ConceptStatsBar';
import TodayConceptReviews from '../components/concepts/TodayConceptReviews';
import AddConceptForm from '../components/concepts/AddConceptForm';
import AllConcepts from '../components/concepts/AllConcepts';
import UpcomingConcepts from '../components/concepts/UpcomingConcepts';
import ConceptHeatmap from '../components/concepts/ConceptHeatmap';

const TABS = [
    { id: 'reviews', label: "Today's Reviews" },
    { id: 'add', label: 'Add Concept' },
    { id: 'all', label: 'All Concepts' },
    { id: 'upcoming', label: 'Upcoming' },
];

export default function ConceptsDashboard() {
    const [activeTab, setActiveTab] = useState('reviews');
    const [concepts, setConcepts] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [pendingCount, setPendingCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);

        const { data: conceptsData } = await supabase
            .from('concepts')
            .select('*')
            .order('created_at', { ascending: false });

        const { data: reviewsData } = await supabase
            .from('concept_reviews')
            .select('*')
            .order('review_date', { ascending: false });

        const cons = conceptsData || [];
        const revs = reviewsData || [];

        setConcepts(cons);
        setReviews(revs);

        const today = format(new Date(), 'yyyy-MM-dd');
        const pending = cons.filter((c) => c.next_review_date <= today).length;
        setPendingCount(pending);

        setLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) {
        return <div className="loading-screen">Loading concepts...</div>;
    }

    return (
        <div className="dashboard">
            <Navbar pendingCount={pendingCount} section="concepts" />

            <div className="dashboard-content">
                <ConceptStatsBar concepts={concepts} />

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
                        <TodayConceptReviews onReviewed={fetchData} />
                    )}
                    {activeTab === 'add' && (
                        <AddConceptForm onConceptAdded={fetchData} />
                    )}
                    {activeTab === 'all' && (
                        <AllConcepts concepts={concepts} onDataChanged={fetchData} />
                    )}
                    {activeTab === 'upcoming' && (
                        <UpcomingConcepts concepts={concepts} />
                    )}
                </div>

                <ConceptHeatmap reviews={reviews} />
            </div>
        </div>
    );
}
