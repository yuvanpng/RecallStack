export default function StatsBar({ problems, streak }) {
    const total = problems.length;
    const strong = problems.filter((p) => p.strength_status === 'Strong').length;
    const weak = problems.filter((p) => p.strength_status === 'Weak').length;
    const medium = problems.filter((p) => p.strength_status === 'Medium').length;

    const strongPct = total > 0 ? Math.round((strong / total) * 100) : 0;
    const weakPct = total > 0 ? Math.round((weak / total) * 100) : 0;
    const mediumPct = total > 0 ? Math.round((medium / total) * 100) : 0;

    return (
        <div className="stats-bar">
            <div className="stat-card">
                <div className="stat-value">{total}</div>
                <div className="stat-label">Total Problems</div>
            </div>
            <div className="stat-card stat-strong">
                <div className="stat-value">{strongPct}%</div>
                <div className="stat-label">Strong ({strong})</div>
            </div>
            <div className="stat-card stat-medium">
                <div className="stat-value">{mediumPct}%</div>
                <div className="stat-label">Medium ({medium})</div>
            </div>
            <div className="stat-card stat-weak">
                <div className="stat-value">{weakPct}%</div>
                <div className="stat-label">Weak ({weak})</div>
            </div>
            <div className="stat-card stat-streak">
                <div className="stat-value">{streak}</div>
                <div className="stat-label">Day Streak 🔥</div>
            </div>
        </div>
    );
}
