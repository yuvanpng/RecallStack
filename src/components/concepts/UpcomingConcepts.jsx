import { useMemo } from 'react';
import { format, addDays, isSameDay, parseISO } from 'date-fns';

export default function UpcomingConcepts({ concepts }) {
    const upcoming = useMemo(() => {
        const today = new Date();
        const days = [];

        for (let i = 0; i <= 30; i++) {
            const date = addDays(today, i);
            const dateStr = format(date, 'yyyy-MM-dd');
            const due = concepts.filter((c) => {
                const reviewDate = typeof c.next_review_date === 'string'
                    ? parseISO(c.next_review_date)
                    : new Date(c.next_review_date);
                return isSameDay(reviewDate, date);
            });

            if (due.length > 0) {
                days.push({
                    date,
                    dateStr,
                    label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : format(date, 'EEE, MMM d'),
                    concepts: due,
                });
            }
        }

        return days;
    }, [concepts]);

    if (upcoming.length === 0) {
        return (
            <div className="empty-state">
                <div className="empty-icon">📅</div>
                <h3>No upcoming concept reviews</h3>
                <p>Add some concepts to see your review schedule.</p>
            </div>
        );
    }

    return (
        <div className="upcoming-calendar">
            <h3>Upcoming Concept Reviews (Next 30 Days)</h3>
            <div className="upcoming-list">
                {upcoming.map((day) => (
                    <div key={day.dateStr} className="upcoming-day">
                        <div className="upcoming-day-header">
                            <span className="upcoming-date">{day.label}</span>
                            <span className="badge">{day.concepts.length}</span>
                        </div>
                        <div className="upcoming-day-items">
                            {day.concepts.map((c) => (
                                <div key={c.id} className="upcoming-item">
                                    <span className="upcoming-title">{c.title}</span>
                                    <span className="subject-badge">{c.subject}</span>
                                    <span className={`strength-badge strength-${c.strength_status.toLowerCase()}`}>
                                        {c.strength_status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
