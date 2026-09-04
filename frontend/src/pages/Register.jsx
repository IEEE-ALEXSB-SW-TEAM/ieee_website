import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "../lib/supabase";
import "../style/Register.css";

function Register() {
    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);
    const [verificationSent, setVerificationSent] = useState(false);

    const handleRegister = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        const cleanEmail = email.trim();
        const cleanUsername = username.trim();

        // Check passwords
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        setLoading(true);

        try {
            const { data, error: signUpError } = await supabase.auth.signUp({
                email: cleanEmail,
                password,
                options: {
                    data: {
                        full_name: cleanUsername,
                    },
                },
            });

            if (signUpError) {
                setError(signUpError.message);
                return;
            }

            // If account already exists with email confirmation enabled, Supabase returns empty identities
            if (data?.user?.identities && data.user.identities.length === 0) {
                setError("An account with this email already exists. Please login instead.");
                return;
            }

            if (data?.session) {
                // Email confirmation is disabled in Supabase, user is signed in immediately
                navigate("/");
            } else if (data?.user) {
                // Email confirmation required by Supabase
                setVerificationSent(true);
            } else {
                navigate("/login");
            }
        } catch (err) {
            console.error("Error:", err);
            setError("Cannot connect to the server.");
        } finally {
            setLoading(false);
        }
    };

    if (verificationSent) {
        return (
            <div className="register-container">
                <div className="verification-card">
                    <div className="verification-icon">📬</div>
                    <h2>Verify Your Email</h2>
                    <p className="verification-text">
                        We have sent a confirmation link to:
                    </p>
                    <div className="verification-email-badge">
                        {email.trim()}
                    </div>
                    <div className="verification-info-box">
                        <p>
                            Please click the link in your email to activate your account before logging in.
                        </p>
                        <p className="spam-hint">
                            💡 Can't find the email? Check your <strong>Spam / Junk</strong> folder.
                        </p>
                    </div>
                    <button
                        type="button"
                        className="verification-action-btn"
                        onClick={() =>
                            navigate("/login", {
                                state: {
                                    message:
                                        "Please check your email to verify your account before logging in.",
                                    email: email.trim(),
                                },
                            })
                        }
                    >
                        Proceed to Login →
                    </button>
                    <div className="verification-footer">
                        <button
                            type="button"
                            className="back-btn"
                            onClick={() => {
                                setVerificationSent(false);
                                setPassword("");
                                setConfirmPassword("");
                            }}
                        >
                            ← Back to registration
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="register-container">

            <h2>Register</h2>

            <form onSubmit={handleRegister}>

                {/* Username */}
                <div className="form-group">
                    <label htmlFor="username">
                        Username
                    </label>

                    <input
                        type="text"
                        id="username"
                        placeholder="Enter your username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>

                {/* Email */}
                <div className="form-group">
                    <label htmlFor="email">
                        Email
                    </label>

                    <input
                        type="email"
                        id="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>

                {/* Password */}
                <div className="form-group">
                    <label htmlFor="password">
                        Password
                    </label>

                    <input
                        type="password"
                        id="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>

                {/* Confirm Password */}
                <div className="form-group">
                    <label htmlFor="confirmPassword">
                        Confirm Password
                    </label>

                    <input
                        type="password"
                        id="confirmPassword"
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(e) =>
                            setConfirmPassword(e.target.value)
                        }
                        required
                    />
                </div>

                {/* Error */}
                {error && (
                    <p className="register-error error-message">
                        {error}
                    </p>
                )}

                {/* Success */}
                {success && (
                    <p className="register-success">
                        {success}
                    </p>
                )}

                {/* Button */}
                <button
                    type="submit"
                    disabled={loading}
                >
                    {loading ? "Creating account..." : "Register"}
                </button>

            </form>

            <p>
                Already have an account?{" "}

                <Link to="/login">
                    Login here
                </Link>
            </p>

        </div>
    );
}

export default Register;