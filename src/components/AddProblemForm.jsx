import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { addDays, format } from 'date-fns';

const PLATFORMS = ['LeetCode', 'CodeStudio', 'HackerRank', 'Codeforces', 'GeeksForGeeks', 'InterviewBit', 'Other'];
const COMMON_TAGS = ['Array', 'String', 'HashMap', 'Two Pointers', 'Sliding Window', 'Stack', 'Queue', 'Linked List', 'Tree', 'BST', 'Graph', 'BFS', 'DFS', 'DP', 'Greedy', 'Binary Search', 'Heap', 'Trie', 'Backtracking', 'Bit Manipulation', 'Math', 'Recursion', 'Sorting'];

export default function AddProblemForm({ onProblemAdded }) {
    const { user } = useAuth();
    const [title, setTitle] = useState('');
    const [platform, setPlatform] = useState('LeetCode');
    const [difficulty, setDifficulty] = useState('Medium');
    const [tagInput, setTagInput] = useState('');
    const [selectedTags, setSelectedTags] = useState([]);
    const [dateLearned, setDateLearned] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    // Patterns
    const [allPatterns, setAllPatterns] = useState([]);
    const [selectedPatternIds, setSelectedPatternIds] = useState([]);

    useEffect(() => {
        fetchPatterns();
    }, []);

    const fetchPatterns = async () => {
        const { data } = await supabase
            .from('patterns')
            .select('*')
            .order('name', { ascending: true });
        setAllPatterns(data || []);
    };

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

    const togglePattern = (patternId) => {
        setSelectedPatternIds((prev) =>
            prev.includes(patternId)
                ? prev.filter((id) => id !== patternId)
                : [...prev, patternId]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        const learnedDate = new Date(dateLearned);
        const nextReview = addDays(learnedDate, 1); // First review in 1 day

        try {
            const { data: insertedProblem, error: insertError } = await supabase.from('problems').insert({
                user_id: user.id,
                title: title.trim(),
                platform,
                difficulty,
                tags: selectedTags,
                notes: notes.trim(),
                created_at: learnedDate.toISOString(),
                next_review_date: format(nextReview, 'yyyy-MM-dd'),
                interval_days: 1,
                strength_status: 'Forgot Completely',
                review_count: 0,
                review_stage: 0,
                is_archived: false,
            }).select().single();

            if (insertError) throw insertError;

            // Link patterns to the problem
            if (selectedPatternIds.length > 0 && insertedProblem) {
                const links = selectedPatternIds.map((patternId) => ({
                    problem_id: insertedProblem.id,
                    pattern_id: patternId,
                }));
                await supabase.from('problem_patterns').insert(links);
            }

            setSuccess(`"${title}" added! First review on ${format(nextReview, 'MMM d, yyyy')}`);
            setTitle('');
            setPlatform('LeetCode');
            setDifficulty('Medium');
            setSelectedTags([]);
            setTagInput('');
            setDateLearned(format(new Date(), 'yyyy-MM-dd'));
            setNotes('');
            setSelectedPatternIds([]);

            if (onProblemAdded) onProblemAdded();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="add-problem-form">
            <h3>Add New Problem</h3>
            {error && <div className="form-error">{error}</div>}
            {success && <div className="form-success">{success}</div>}

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="title">Problem Title *</label>
                    <input
                        id="title"
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Two Sum"
                        required
                    />
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="platform">Platform</label>
                        <select id="platform" value={platform} onChange={(e) => setPlatform(e.target.value)}>
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
                                        name="difficulty"
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
                            placeholder="Type and press Enter, or click below"
                        />
                    </div>
                    <div className="common-tags">
                        {COMMON_TAGS.filter((t) => !selectedTags.includes(t)).slice(0, 12).map((tag) => (
                            <button key={tag} type="button" className="tag-suggestion" onClick={() => addTag(tag)}>
                                + {tag}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Patterns Selector */}
                {allPatterns.length > 0 && (
                    <div className="form-group">
                        <label>Patterns (for mastery tracking)</label>
                        <div className="common-tags">
                            {allPatterns.map((pattern) => (
                                <button
                                    key={pattern.id}
                                    type="button"
                                    className={`pattern-chip ${selectedPatternIds.includes(pattern.id) ? 'selected' : ''}`}
                                    onClick={() => togglePattern(pattern.id)}
                                >
                                    {selectedPatternIds.includes(pattern.id) ? '✓ ' : '+ '}
                                    {pattern.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="dateLearned">Date Learned</label>
                        <input
                            id="dateLearned"
                            type="date"
                            value={dateLearned}
                            onChange={(e) => setDateLearned(e.target.value)}
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="notes">Notes (approach/key insight)</label>
                    <textarea
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Brief summary of your approach..."
                        rows={3}
                    />
                </div>

                <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                    {loading ? 'Adding...' : 'Add Problem'}
                </button>
            </form>
        </div>
    );
}
