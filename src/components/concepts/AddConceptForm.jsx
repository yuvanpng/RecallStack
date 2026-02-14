import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { addDays, format } from 'date-fns';

const SUBJECTS = ['OS', 'CN', 'DBMS', 'OOP', 'System Design', 'Math', 'Aptitude', 'Other'];

export default function AddConceptForm({ onConceptAdded }) {
    const { user } = useAuth();
    const [title, setTitle] = useState('');
    const [subject, setSubject] = useState('OS');
    const [topic, setTopic] = useState('');
    const [dateLearned, setDateLearned] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        const learnedDate = new Date(dateLearned);
        const nextReview = addDays(learnedDate, 4);

        try {
            const { error: insertError } = await supabase.from('concepts').insert({
                user_id: user.id,
                title: title.trim(),
                subject,
                topic: topic.trim(),
                notes: notes.trim(),
                created_at: learnedDate.toISOString(),
                next_review_date: format(nextReview, 'yyyy-MM-dd'),
                interval_days: 4,
                strength_status: 'Weak',
                review_count: 0,
            });

            if (insertError) throw insertError;

            setSuccess(`"${title}" added! First review on ${format(nextReview, 'MMM d, yyyy')}`);
            setTitle('');
            setSubject('OS');
            setTopic('');
            setDateLearned(format(new Date(), 'yyyy-MM-dd'));
            setNotes('');

            if (onConceptAdded) onConceptAdded();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="add-problem-form">
            <h3>Add New Concept</h3>
            {error && <div className="form-error">{error}</div>}
            {success && <div className="form-success">{success}</div>}

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="concept-title">Concept Title *</label>
                    <input
                        id="concept-title"
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Process Scheduling Algorithms"
                        required
                    />
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="subject">Subject</label>
                        <select id="subject" value={subject} onChange={(e) => setSubject(e.target.value)}>
                            {SUBJECTS.map((s) => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="topic">Topic / Chapter</label>
                        <input
                            id="topic"
                            type="text"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="e.g. CPU Scheduling"
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="concept-date">Date Learned</label>
                    <input
                        id="concept-date"
                        type="date"
                        value={dateLearned}
                        onChange={(e) => setDateLearned(e.target.value)}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="concept-notes">Notes (key points / summary)</label>
                    <textarea
                        id="concept-notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Brief summary of the concept, key formulas, or important points..."
                        rows={4}
                    />
                </div>

                <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                    {loading ? 'Adding...' : 'Add Concept'}
                </button>
            </form>
        </div>
    );
}
