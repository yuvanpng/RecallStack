import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Navbar({ pendingCount, section }) {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const activeSection = section || (location.pathname === '/concepts' ? 'concepts' : 'dsa');

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    return (
        <nav className="navbar">
            <div className="navbar-left">
                <div className="navbar-brand">
                    <h2>RecallStack</h2>
                    {pendingCount > 0 && (
                        <span className="notification-badge">{pendingCount}</span>
                    )}
                </div>
                <div className="section-switcher">
                    <button
                        className={`section-btn ${activeSection === 'dsa' ? 'active' : ''}`}
                        onClick={() => navigate('/')}
                    >
                        🧩 DSA
                    </button>
                    <button
                        className={`section-btn ${activeSection === 'concepts' ? 'active' : ''}`}
                        onClick={() => navigate('/concepts')}
                    >
                        📚 Concepts
                    </button>
                </div>
            </div>
            <div className="navbar-right">
                <span className="navbar-email">{user?.email}</span>
                <button onClick={handleSignOut} className="btn btn-ghost">
                    Sign Out
                </button>
            </div>
        </nav>
    );
}
