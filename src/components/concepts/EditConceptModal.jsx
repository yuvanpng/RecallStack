import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

const SUBJECTS = ['OS', 'CN', 'DBMS', 'OOP', 'System Design', 'Math', 'Aptitude', 'Other'];

export default function EditConceptModal({ concept, onClose, onSaved }) {
    const [title, setTitle] = useState(concept.title);
    const [subject, setSubject] = useState(concept.subject);
    const [topic, setTopic] = useState(concept.topic || '');
    const [notes, setNotes] = useState(concept.notes || '');
    const [strengthStatus, setStrengthStatus] = useState(concept.strength_status);
    const [nextReviewDate, setNextReviewDate] = useState(concept.next_review_date || '');
    const [intervalDays, setIntervalDays] = useState(concept.interval_days);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const { error: updateError } = await supabase
                .from('concepts')
                .update({
                    title: title.trim(),
                    subject,
                    topic: topic.trim(),
                    notes: notes.trim(),
                    strength_status: strengthStatus,
                    next_review_date: nextReviewDate,
                    interval_days: intervalDays,
                })
                .eq('id', concept.id);

            if (updateError) throw updateError;

            if (onSaved) onSaved();
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Edit Concept</h3>
                    <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
                </div>

                {error && <div className="form-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="edit-concept-title">Concept Title *</label>
                        <input
                            id="edit-concept-title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="edit-subject">Subject</label>
                            <select id="edit-subject" value={subject} onChange={(e) => setSubject(e.target.value)}>
                                {SUBJECTS.map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="edit-topic">Topic / Chapter</label>
                            <input
                                id="edit-topic"
                                type="text"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="edit-concept-notes">Notes</label>
                        <textarea
                            id="edit-concept-notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={4}
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Strength Status</label>
                            <div className="difficulty-group">
                                {['Weak', 'Medium', 'Strong'].map((s) => (
                                    <label key={s} className={`difficulty-option ${strengthStatus === s ? 'active' : ''} ${s === 'Strong' ? 'diff-easy' : s === 'Medium' ? 'diff-medium' : 'diff-hard'}`}>
                                        <input
                                            type="radio"
                                            name="edit-concept-strength"
                                            value={s}
                                            checked={strengthStatus === s}
                                            onChange={(e) => setStrengthStatus(e.target.value)}
                                        />
                                        {s}
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="edit-concept-next-review">Next Review Date</label>
                            <input
                                id="edit-concept-next-review"
                                type="date"
                                value={nextReviewDate}
                                onChange={(e) => setNextReviewDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="edit-concept-interval">Interval (days)</label>
                        <input
                            id="edit-concept-interval"
                            type="number"
                            min="1"
                            value={intervalDays}
                            onChange={(e) => setIntervalDays(parseInt(e.target.value) || 4)}
                        />
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
