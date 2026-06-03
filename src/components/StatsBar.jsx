import { getStrengthClass } from '../lib/reviewEngine';

export default function StatsBar({ problems, streak, patterns, archivedCount }) {
    const active = problems.filter((p) => !p.is_archived);
    const total = active.length;
    const easyRecall = active.filter((p) => p.strength_status === 'Easy Recall').length;
    const hardRecall = active.filter((p) => p.strength_status === 'Hard Recall').length;
    const forgot = active.filter((p) => p.strength_status === 'Forgot Completely').length;

    const easyPct = total > 0 ? Math.round((easyRecall / total) * 100) : 0;
    const hardPct = total > 0 ? Math.round((hardRecall / total) * 100) : 0;
    const forgotPct = total > 0 ? Math.round((forgot / total) * 100) : 0;

    // Weakest patterns (bottom 3)
    const weakestPatterns = patterns
        ? [...patterns]
              .sort((a, b) => a.confidence - b.confidence)
              .slice(0, 3)
        : [];

    const getConfidenceClass = (conf) => {
        if (conf < 40) return 'low';
        if (conf < 70) return 'medium';
        return 'high';
    };

    return (
        <>
            <div className="stats-bar">
                <div className="stat-card">
                    <div className="stat-value">{total}</div>
                    <div className="stat-label">Active Problems</div>
                </div>
                <div className="stat-card stat-strong">
                    <div className="stat-value">{easyPct}%</div>
                    <div className="stat-label">Easy Recall ({easyRecall})</div>
                </div>
                <div className="stat-card stat-medium">
                    <div className="stat-value">{hardPct}%</div>
                    <div className="stat-label">Hard Recall ({hardRecall})</div>
                </div>
                <div className="stat-card stat-weak">
                    <div className="stat-value">{forgotPct}%</div>
                    <div className="stat-label">Forgot ({forgot})</div>
                </div>
                <div className="stat-card stat-streak">
                    <div className="stat-value">
                        {streak} <span className="streak-fire">🔥</span>
                    </div>
                    <div className="stat-label">Day Streak</div>
                </div>
                {archivedCount > 0 && (
                    <div className="stat-card">
                        <div className="stat-value" style={{ color: 'var(--purple)' }}>
                            {archivedCount}
                        </div>
                        <div className="stat-label">📦 Archived</div>
                    </div>
                )}
            </div>

            {/* Weakest Patterns Mini Display */}
            {weakestPatterns.length > 0 && (
                <div className="weakest-patterns-mini">
                    <h4>⚠️ Weakest Patterns</h4>
                    {weakestPatterns.map((p) => (
                        <div key={p.id} className="weakest-pattern-row">
                            <span className="name">{p.name}</span>
                            <div className="pattern-confidence">
                                <div className="pattern-confidence-bar">
                                    <div
                                        className={`pattern-confidence-fill ${getConfidenceClass(p.confidence)}`}
                                        style={{ width: `${p.confidence}%` }}
                                    />
                                </div>
                                <span className={`pattern-confidence-value ${getConfidenceClass(p.confidence)}`}>
                                    {p.confidence}%
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
}
