import { useMemo } from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { subDays, format } from 'date-fns';

export default function Heatmap({ reviews }) {
    const today = new Date();
    const startDate = subDays(today, 365);

    const heatmapValues = useMemo(() => {
        const countMap = {};
        reviews.forEach((r) => {
            const date = r.review_date;
            countMap[date] = (countMap[date] || 0) + 1;
        });

        return Object.entries(countMap).map(([date, count]) => ({
            date,
            count,
        }));
    }, [reviews]);

    const getClassForValue = (value) => {
        if (!value || value.count === 0) return 'color-empty';
        if (value.count <= 2) return 'color-scale-1';
        if (value.count <= 4) return 'color-scale-2';
        if (value.count <= 6) return 'color-scale-3';
        return 'color-scale-4';
    };

    return (
        <div className="heatmap-container">
            <h3>Review Activity</h3>
            <CalendarHeatmap
                startDate={startDate}
                endDate={today}
                values={heatmapValues}
                classForValue={getClassForValue}
                titleForValue={(value) => {
                    if (!value || !value.date) return 'No reviews';
                    return `${value.date}: ${value.count} review${value.count > 1 ? 's' : ''}`;
                }}
                showWeekdayLabels
            />
        </div>
    );
}
