import { useState, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { format } from 'date-fns';
import EditConceptModal from './EditConceptModal';

export default function AllConcepts({ concepts, onDataChanged }) {
    const [search, setSearch] = useState('');
    const [filterStrength, setFilterStrength] = useState('All');
    const [filterSubject, setFilterSubject] = useState('All');
    const [sortBy, setSortBy] = useState('created_at');
    const [sortDir, setSortDir] = useState('desc');
    const [editingConcept, setEditingConcept] = useState(null);

    const allSubjects = useMemo(() => {
        const set = new Set();
        concepts.forEach((c) => { if (c.subject) set.add(c.subject); });
        return ['All', ...Array.from(set).sort()];
    }, [concepts]);

    const filtered = useMemo(() => {
        let result = [...concepts];

        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(
                (c) =>
                    c.title.toLowerCase().includes(q) ||
                    c.subject.toLowerCase().includes(q) ||
                    (c.topic || '').toLowerCase().includes(q)
            );
        }

        if (filterStrength !== 'All') {
            result = result.filter((c) => c.strength_status === filterStrength);
        }
        if (filterSubject !== 'All') {
            result = result.filter((c) => c.subject === filterSubject);
        }

        result.sort((a, b) => {
            let valA = a[sortBy];
            let valB = b[sortBy];
            if (sortBy === 'title' || sortBy === 'subject') {
                valA = (valA || '').toLowerCase();
                valB = (valB || '').toLowerCase();
            }
            if (valA < valB) return sortDir === 'asc' ? -1 : 1;
            if (valA > valB) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [concepts, search, filterStrength, filterSubject, sortBy, sortDir]);

    const handleSort = (col) => {
        if (sortBy === col) {
            setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(col);
            setSortDir('asc');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this concept?')) return;
        const { error } = await supabase.from('concepts').delete().eq('id', id);
        if (!error && onDataChanged) onDataChanged();
    };

    const exportCSV = () => {
        const headers = ['Title', 'Subject', 'Topic', 'Strength', 'Review Count', 'Next Review', 'Notes'];
        const rows = filtered.map((c) => [
            c.title,
            c.subject,
            c.topic || '',
            c.strength_status,
            c.review_count,
            c.next_review_date,
            (c.notes || '').replace(/"/g, '""'),
        ]);

        const csv = [headers.join(','), ...rows.map((r) => r.map((v) => `"${v}"`).join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `recallstack-concepts-${format(new Date(), 'yyyy-MM-dd')}.csv`;
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
                <h3>All Concepts</h3>
                <button className="btn btn-ghost" onClick={exportCSV}>📥 Export CSV</button>
            </div>

            <div className="filters-bar">
                <input
                    type="text"
                    className="search-input"
                    placeholder="Search title, subject, topic..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <select value={filterStrength} onChange={(e) => setFilterStrength(e.target.value)}>
                    <option value="All">All Strength</option>
                    <option value="Weak">Weak</option>
                    <option value="Medium">Medium</option>
                    <option value="Strong">Strong</option>
                </select>
                <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)}>
                    {allSubjects.map((s) => (
                        <option key={s} value={s}>{s === 'All' ? 'All Subjects' : s}</option>
                    ))}
                </select>
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th onClick={() => handleSort('title')} className="sortable">Title{sortIcon('title')}</th>
                            <th onClick={() => handleSort('subject')} className="sortable">Subject{sortIcon('subject')}</th>
                            <th>Topic</th>
                            <th onClick={() => handleSort('strength_status')} className="sortable">Strength{sortIcon('strength_status')}</th>
                            <th onClick={() => handleSort('review_count')} className="sortable">Reviews{sortIcon('review_count')}</th>
                            <th onClick={() => handleSort('next_review_date')} className="sortable">Next Review{sortIcon('next_review_date')}</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="empty-table">No concepts found</td>
                            </tr>
                        ) : (
                            filtered.map((c) => (
                                <tr key={c.id}>
                                    <td className="td-title">{c.title}</td>
                                    <td><span className="subject-badge">{c.subject}</span></td>
                                    <td className="td-topic">{c.topic}</td>
                                    <td>
                                        <span className={`strength-badge strength-${c.strength_status.toLowerCase()}`}>
                                            {c.strength_status}
                                        </span>
                                    </td>
                                    <td>{c.review_count}</td>
                                    <td>{c.next_review_date}</td>
                                    <td>
                                        <button className="btn btn-ghost btn-sm" onClick={() => setEditingConcept(c)}>✏️</button>
                                        <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(c.id)}>🗑</button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="table-footer">
                Showing {filtered.length} of {concepts.length} concepts
            </div>

            {editingConcept && (
                <EditConceptModal
                    concept={editingConcept}
                    onClose={() => setEditingConcept(null)}
                    onSaved={onDataChanged}
                />
            )}
        </div>
    );
}
