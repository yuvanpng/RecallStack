import { useMemo } from 'react';
import { format, addDays, isSameDay, parseISO } from 'date-fns';
import { getStrengthClass } from '../lib/reviewEngine';

export default function UpcomingCalendar({ problems }) {
    const upcoming = useMemo(() => {
        const today = new Date();
        const days = [];

        for (let i = 0; i <= 30; i++) {
            const date = addDays(today, i);
            const dateStr = format(date, 'yyyy-MM-dd');
            const due = problems.filter((p) => {
                if (p.is_archived) return false;
                const reviewDate = typeof p.next_review_date === 'string'
                    ? parseISO(p.next_review_date)
                    : new Date(p.next_review_date);
                return isSameDay(reviewDate, date);
            });

            if (due.length > 0) {
                days.push({
                    date,
                    dateStr,
                    label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : format(date, 'EEE, MMM d'),
                    problems: due,
                });
            }
        }

        return days;
    }, [problems]);

    if (upcoming.length === 0) {
        return (
            <div className="empty-state">
                <div className="empty-icon">📅</div>
                <h3>No upcoming reviews</h3>
                <p>Add some problems to see your review schedule.</p>
            </div>
        );
    }

    return (
        <div className="upcoming-calendar">
            <h3>Upcoming Reviews (Next 30 Days)</h3>
            <div className="upcoming-list">
                {upcoming.map((day) => (
                    <div key={day.dateStr} className="upcoming-day">
                        <div className="upcoming-day-header">
                            <span className="upcoming-date">{day.label}</span>
                            <span className="badge">{day.problems.length}</span>
                        </div>
                        <div className="upcoming-day-items">
                            {day.problems.map((p) => (
                                <div key={p.id} className="upcoming-item">
                                    <span className="upcoming-title">{p.title}</span>
                                    <span className={`strength-badge strength-${getStrengthClass(p.strength_status)}`}>
                                        {p.strength_status}
                                    </span>
                                    <span className={`difficulty-badge diff-${p.difficulty.toLowerCase()}`}>
                                        {p.difficulty}
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
