export default function ConceptStatsBar({ concepts, streak }) {
    const total = concepts.length;
    const strong = concepts.filter((c) => c.strength_status === 'Strong').length;
    const weak = concepts.filter((c) => c.strength_status === 'Weak').length;
    const medium = concepts.filter((c) => c.strength_status === 'Medium').length;

    const strongPct = total > 0 ? Math.round((strong / total) * 100) : 0;
    const weakPct = total > 0 ? Math.round((weak / total) * 100) : 0;
    const mediumPct = total > 0 ? Math.round((medium / total) * 100) : 0;

    // Count unique subjects
    const subjects = new Set(concepts.map((c) => c.subject));

    return (
        <div className="stats-bar">
            <div className="stat-card">
                <div className="stat-value">{total}</div>
                <div className="stat-label">Total Concepts</div>
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
                <div className="stat-value">{subjects.size}</div>
                <div className="stat-label">Subjects 📚</div>
            </div>
        </div>
    );
}
