import { useState, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { format } from 'date-fns';
import { getStrengthClass } from '../lib/reviewEngine';
import EditProblemModal from './EditProblemModal';

export default function AllProblems({ problems, onDataChanged }) {
    const [search, setSearch] = useState('');
    const [filterStrength, setFilterStrength] = useState('All');
    const [filterDifficulty, setFilterDifficulty] = useState('All');
    const [filterTag, setFilterTag] = useState('All');
    const [filterArchive, setFilterArchive] = useState('active');
    const [sortBy, setSortBy] = useState('created_at');
    const [sortDir, setSortDir] = useState('desc');
    const [editingProblem, setEditingProblem] = useState(null);

    // Gather all unique tags
    const allTags = useMemo(() => {
        const tagSet = new Set();
        problems.forEach((p) => p.tags?.forEach((t) => tagSet.add(t)));
        return ['All', ...Array.from(tagSet).sort()];
    }, [problems]);

    const filtered = useMemo(() => {
        let result = [...problems];

        // Archive filter
        if (filterArchive === 'active') {
            result = result.filter((p) => !p.is_archived);
        } else if (filterArchive === 'archived') {
            result = result.filter((p) => p.is_archived);
        }

        // Search
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(
                (p) =>
                    p.title.toLowerCase().includes(q) ||
                    p.tags?.some((t) => t.toLowerCase().includes(q)) ||
                    p.platform.toLowerCase().includes(q)
            );
        }

        // Filters
        if (filterStrength !== 'All') {
            result = result.filter((p) => p.strength_status === filterStrength);
        }
        if (filterDifficulty !== 'All') {
            result = result.filter((p) => p.difficulty === filterDifficulty);
        }
        if (filterTag !== 'All') {
            result = result.filter((p) => p.tags?.includes(filterTag));
        }

        // Sort
        result.sort((a, b) => {
            let valA = a[sortBy];
            let valB = b[sortBy];
            if (sortBy === 'title') {
                valA = valA?.toLowerCase() || '';
                valB = valB?.toLowerCase() || '';
            }
            if (valA < valB) return sortDir === 'asc' ? -1 : 1;
            if (valA > valB) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [problems, search, filterStrength, filterDifficulty, filterTag, filterArchive, sortBy, sortDir]);

    const handleSort = (col) => {
        if (sortBy === col) {
            setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(col);
            setSortDir('asc');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this problem?')) return;
        const { error } = await supabase.from('problems').delete().eq('id', id);
        if (!error && onDataChanged) onDataChanged();
    };

    const handleArchive = async (id, currentlyArchived) => {
        const { error } = await supabase
            .from('problems')
            .update({ is_archived: !currentlyArchived })
            .eq('id', id);
        if (!error && onDataChanged) onDataChanged();
    };

    const exportCSV = () => {
        const headers = ['Title', 'Platform', 'Difficulty', 'Tags', 'Strength', 'Review Count', 'Next Review', 'Notes'];
        const rows = filtered.map((p) => [
            p.title,
            p.platform,
            p.difficulty,
            (p.tags || []).join('; '),
            p.strength_status,
            p.review_count,
            p.next_review_date,
            (p.notes || '').replace(/"/g, '""'),
        ]);

        const csv = [headers.join(','), ...rows.map((r) => r.map((v) => `"${v}"`).join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `recallstack-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const sortIcon = (col) => {
        if (sortBy !== col) return '';
        return sortDir === 'asc' ? ' ↑' : ' ↓';
    };

    return (
        <div className="all-problems">
            <div className="section-header">
                <h3>All Problems</h3>
                <button className="btn btn-ghost" onClick={exportCSV}>📥 Export CSV</button>
            </div>

            <div className="filters-bar">
                <input
                    type="text"
                    className="search-input"
                    placeholder="Search titles, tags, platform..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <select value={filterStrength} onChange={(e) => setFilterStrength(e.target.value)}>
                    <option value="All">All Status</option>
                    <option value="Forgot Completely">Forgot Completely</option>
                    <option value="Hard Recall">Hard Recall</option>
                    <option value="Easy Recall">Easy Recall</option>
                </select>
                <select value={filterDifficulty} onChange={(e) => setFilterDifficulty(e.target.value)}>
                    <option value="All">All Difficulty</option>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                </select>
                <select value={filterTag} onChange={(e) => setFilterTag(e.target.value)}>
                    {allTags.map((t) => (
                        <option key={t} value={t}>{t === 'All' ? 'All Tags' : t}</option>
                    ))}
                </select>
                <div className="archive-filter">
                    {['active', 'archived', 'all'].map((f) => (
                        <button
                            key={f}
                            className={`archive-filter-btn ${filterArchive === f ? 'active' : ''}`}
                            onClick={() => setFilterArchive(f)}
                        >
                            {f === 'active' ? '📋 Active' : f === 'archived' ? '📦 Archived' : '🔍 All'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th onClick={() => handleSort('title')} className="sortable">Title{sortIcon('title')}</th>
                            <th onClick={() => handleSort('platform')} className="sortable">Platform{sortIcon('platform')}</th>
                            <th onClick={() => handleSort('difficulty')} className="sortable">Difficulty{sortIcon('difficulty')}</th>
                            <th>Tags</th>
                            <th onClick={() => handleSort('strength_status')} className="sortable">Strength{sortIcon('strength_status')}</th>
                            <th onClick={() => handleSort('review_count')} className="sortable">Reviews{sortIcon('review_count')}</th>
                            <th onClick={() => handleSort('next_review_date')} className="sortable">Next Review{sortIcon('next_review_date')}</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan="8" className="empty-table">No problems found</td>
                            </tr>
                        ) : (
                            filtered.map((p) => (
                                <tr key={p.id} className={p.is_archived ? 'archived-row' : ''}>
                                    <td className="td-title">{p.title}</td>
                                    <td>{p.platform}</td>
                                    <td>
                                        <span className={`difficulty-badge diff-${p.difficulty.toLowerCase()}`}>{p.difficulty}</span>
                                    </td>
                                    <td>
                                        <div className="td-tags">
                                            {p.tags?.map((t) => (
                                                <span key={t} className="tag-small">{t}</span>
                                            ))}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`strength-badge strength-${getStrengthClass(p.strength_status)}`}>
                                            {p.strength_status}
                                        </span>
                                        {p.is_archived && <span className="archived-badge">Archived</span>}
                                    </td>
                                    <td>{p.review_count}</td>
                                    <td>{p.next_review_date}</td>
                                    <td>
                                        <button className="btn btn-ghost btn-sm" onClick={() => setEditingProblem(p)}>✏️</button>
                                        <button className="btn btn-ghost btn-sm" onClick={() => handleArchive(p.id, p.is_archived)}>
                                            {p.is_archived ? '📤' : '📦'}
                                        </button>
                                        <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(p.id)}>🗑</button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="table-footer">
                Showing {filtered.length} of {problems.length} problems
            </div>

            {editingProblem && (
                <EditProblemModal
                    problem={editingProblem}
                    onClose={() => setEditingProblem(null)}
                    onSaved={onDataChanged}
                />
            )}
        </div>
    );
}
