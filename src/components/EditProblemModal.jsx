import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const PLATFORMS = ['LeetCode', 'CodeStudio', 'HackerRank', 'Codeforces', 'GeeksForGeeks', 'InterviewBit', 'Other'];
const COMMON_TAGS = ['Array', 'String', 'HashMap', 'Two Pointers', 'Sliding Window', 'Stack', 'Queue', 'Linked List', 'Tree', 'BST', 'Graph', 'BFS', 'DFS', 'DP', 'Greedy', 'Binary Search', 'Heap', 'Trie', 'Backtracking', 'Bit Manipulation', 'Math', 'Recursion', 'Sorting'];

export default function EditProblemModal({ problem, onClose, onSaved }) {
    const [title, setTitle] = useState(problem.title);
    const [platform, setPlatform] = useState(problem.platform);
    const [difficulty, setDifficulty] = useState(problem.difficulty);
    const [selectedTags, setSelectedTags] = useState(problem.tags || []);
    const [tagInput, setTagInput] = useState('');
    const [notes, setNotes] = useState(problem.notes || '');
    const [strengthStatus, setStrengthStatus] = useState(problem.strength_status);
    const [nextReviewDate, setNextReviewDate] = useState(problem.next_review_date || '');
    const [intervalDays, setIntervalDays] = useState(problem.interval_days);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const addTag = (tag) => {
        const trimmed = tag.trim();
        if (trimmed && !selectedTags.includes(trimmed)) {
            setSelectedTags([...selectedTags, trimmed]);
        }
        setTagInput('');
    };

    const removeTag = (tag) => {
        setSelectedTags(selectedTags.filter((t) => t !== tag));
    };

    const handleTagKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addTag(tagInput);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const { error: updateError } = await supabase
                .from('problems')
                .update({
                    title: title.trim(),
                    platform,
                    difficulty,
                    tags: selectedTags,
                    notes: notes.trim(),
                    strength_status: strengthStatus,
                    next_review_date: nextReviewDate,
                    interval_days: intervalDays,
                })
                .eq('id', problem.id);

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
                    <h3>Edit Problem</h3>
                    <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
                </div>

                {error && <div className="form-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="edit-title">Problem Title *</label>
                        <input
                            id="edit-title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="edit-platform">Platform</label>
                            <select id="edit-platform" value={platform} onChange={(e) => setPlatform(e.target.value)}>
                                {PLATFORMS.map((p) => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Difficulty</label>
                            <div className="difficulty-group">
                                {['Easy', 'Medium', 'Hard'].map((d) => (
                                    <label key={d} className={`difficulty-option ${difficulty === d ? 'active' : ''} diff-${d.toLowerCase()}`}>
                                        <input
                                            type="radio"
                                            name="edit-difficulty"
                                            value={d}
                                            checked={difficulty === d}
                                            onChange={(e) => setDifficulty(e.target.value)}
                                        />
                                        {d}
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Tags</label>
                        <div className="tags-input-container">
                            <div className="selected-tags">
                                {selectedTags.map((tag) => (
                                    <span key={tag} className="tag">
                                        {tag}
                                        <button type="button" onClick={() => removeTag(tag)}>&times;</button>
                                    </span>
                                ))}
                            </div>
                            <input
                                type="text"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={handleTagKeyDown}
                                placeholder="Type and press Enter"
                            />
                        </div>
                        <div className="common-tags">
                            {COMMON_TAGS.filter((t) => !selectedTags.includes(t)).slice(0, 10).map((tag) => (
                                <button key={tag} type="button" className="tag-suggestion" onClick={() => addTag(tag)}>
                                    + {tag}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="edit-notes">Notes</label>
                        <textarea
                            id="edit-notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
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
                                            name="edit-strength"
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
                            <label htmlFor="edit-next-review">Next Review Date</label>
                            <input
                                id="edit-next-review"
                                type="date"
                                value={nextReviewDate}
                                onChange={(e) => setNextReviewDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="edit-interval">Interval (days)</label>
                        <input
                            id="edit-interval"
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
