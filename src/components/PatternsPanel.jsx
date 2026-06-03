import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

export default function PatternsPanel() {
    const { user } = useAuth();
    const [patterns, setPatterns] = useState([]);
    const [newPattern, setNewPattern] = useState('');
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);

    const fetchPatterns = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('patterns')
            .select('*')
            .order('confidence', { ascending: true });

        if (error) {
            console.error('Error fetching patterns:', error.message);
        } else {
            setPatterns(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchPatterns();
    }, []);

    const handleAddPattern = async (e) => {
        e.preventDefault();
        const name = newPattern.trim();
        if (!name || !user) return;

        setAdding(true);
        try {
            const { error } = await supabase.from('patterns').insert({
                user_id: user.id,
                name,
                confidence: 50,
            });

            if (error) {
                if (error.code === '23505') {
                    alert('Pattern already exists!');
                } else {
                    throw error;
                }
            } else {
                setNewPattern('');
                fetchPatterns();
            }
        } catch (err) {
            console.error('Error adding pattern:', err.message);
        } finally {
            setAdding(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this pattern? This will unlink it from all problems.')) return;
        const { error } = await supabase.from('patterns').delete().eq('id', id);
        if (!error) fetchPatterns();
    };

    const getConfidenceClass = (conf) => {
        if (conf < 40) return 'low';
        if (conf < 70) return 'medium';
        return 'high';
    };

    if (loading) {
        return <div className="section-loading">Loading patterns...</div>;
    }

    // Separate into weakest and all
    const weakest = [...patterns].sort((a, b) => a.confidence - b.confidence).slice(0, 5);
    const allSorted = [...patterns].sort((a, b) => a.name.localeCompare(b.name));

    return (
        <div className="patterns-panel">
            {/* Weakest Patterns */}
            <div className="patterns-section">
                <h4>⚠️ Weakest Patterns</h4>
                {weakest.length === 0 ? (
                    <div className="pattern-empty">
                        No patterns yet. Add your first pattern below!
                    </div>
                ) : (
                    <div className="pattern-list">
                        {weakest.map((pattern, index) => (
                            <div key={pattern.id} className="pattern-item">
                                <span className="pattern-rank">{index + 1}.</span>
                                <span className="pattern-name">{pattern.name}</span>
                                <div className="pattern-confidence">
                                    <div className="pattern-confidence-bar">
                                        <div
                                            className={`pattern-confidence-fill ${getConfidenceClass(pattern.confidence)}`}
                                            style={{ width: `${pattern.confidence}%` }}
                                        />
                                    </div>
                                    <span className={`pattern-confidence-value ${getConfidenceClass(pattern.confidence)}`}>
                                        {pattern.confidence}%
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* All Patterns */}
            <div className="patterns-section">
                <h4>📊 All Patterns</h4>
                {allSorted.length === 0 ? (
                    <div className="pattern-empty">
                        No patterns yet. Start by adding common DSA patterns!
                    </div>
                ) : (
                    <div className="patterns-grid">
                        {allSorted.map((pattern) => (
                            <div key={pattern.id} className="pattern-item">
                                <span className="pattern-name">{pattern.name}</span>
                                <div className="pattern-confidence">
                                    <div className="pattern-confidence-bar">
                                        <div
                                            className={`pattern-confidence-fill ${getConfidenceClass(pattern.confidence)}`}
                                            style={{ width: `${pattern.confidence}%` }}
                                        />
                                    </div>
                                    <span className={`pattern-confidence-value ${getConfidenceClass(pattern.confidence)}`}>
                                        {pattern.confidence}%
                                    </span>
                                </div>
                                <button
                                    className="pattern-delete"
                                    onClick={() => handleDelete(pattern.id)}
                                    title="Delete pattern"
                                >
                                    🗑
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add Pattern */}
            <div className="patterns-section">
                <h4>➕ Add Pattern</h4>
                <form onSubmit={handleAddPattern} className="add-pattern-row">
                    <input
                        type="text"
                        value={newPattern}
                        onChange={(e) => setNewPattern(e.target.value)}
                        placeholder="e.g. Sliding Window, Two Pointers..."
                    />
                    <button type="submit" className="btn btn-primary" disabled={adding || !newPattern.trim()}>
                        {adding ? 'Adding...' : 'Add'}
                    </button>
                </form>

                {/* Quick-add common patterns */}
                <div className="common-tags" style={{ marginTop: '0.75rem' }}>
                    {[
                        'Sliding Window', 'Two Pointers', 'Binary Search', 'DFS', 'BFS',
                        'Dynamic Programming', 'Backtracking', 'Greedy', 'Stack', 'Queue',
                        'Linked List', 'Tree', 'Graph', 'Heap', 'Trie', 'Bit Manipulation',
                        'Sorting', 'Recursion', 'HashMap', 'Math',
                    ]
                        .filter((name) => !patterns.some((p) => p.name === name))
                        .slice(0, 12)
                        .map((name) => (
                            <button
                                key={name}
                                type="button"
                                className="tag-suggestion"
                                onClick={async () => {
                                    if (!user) return;
                                    await supabase.from('patterns').insert({
                                        user_id: user.id,
                                        name,
                                        confidence: 50,
                                    });
                                    fetchPatterns();
                                }}
                            >
                                + {name}
                            </button>
                        ))}
                </div>
            </div>
        </div>
    );
}
