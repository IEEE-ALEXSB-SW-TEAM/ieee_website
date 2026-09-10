import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import '../style/Login.css';

function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const { signIn, session, isAdmin, loading: authLoading } = useAuth();

    const infoMessage = location.state?.message;
    const initialEmail = location.state?.email || '';

    const [email, setEmail] = useState(initialEmail);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // If already logged in, redirect based on role
    useEffect(() => {
        if (session && !authLoading) {
            if (isAdmin) {
                navigate('/admin', { replace: true });
            } else {
                navigate('/', { replace: true });
            }
        }
    }, [session, isAdmin, authLoading, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const cleanEmail = email.trim();

        try {
            const { error: signInError, isAdmin: userIsAdmin } = await signIn(cleanEmail, password);

            if (signInError) {
                const msg = signInError.message || '';
                if (msg.toLowerCase().includes('email not confirmed')) {
                    setError('Your email is not verified yet. Please check your inbox (and spam folder) for the verification link before logging in.');
                } else if (msg.toLowerCase().includes('invalid login credentials')) {
                    setError('Invalid email or password. Please check your credentials or register a new account.');
                } else {
                    setError(msg);
                }
            } else {
                // If user logged in as admin, go to /admin; otherwise go to homepage
                if (userIsAdmin) {
                    navigate('/admin');
                } else {
                    navigate('/');
                }
            }
        } catch (err) {
            setError('An error occurred. Please try again later.');
            console.error('Login error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <h2>Login</h2>
            <form onSubmit={handleSubmit}>
                {infoMessage && !error && (
                    <div className="login-info-message">
                        <span className="info-icon">ℹ️</span>
                        <span>{infoMessage}</span>
                    </div>
                )}
                <div className="form-group">
                    <label htmlFor="email">Email:</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="password">Password:</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        required
                    />
                </div>
                {error && <p className="error-message">{error}</p>}
                <button type="submit" disabled={loading}>
                    {loading ? 'Logging in...' : 'Login'}
                </button>
            </form>
            <p>
                Don't have an account? <Link to="/register">Register here</Link>
            </p>
        </div>
    );
}

export default Login;