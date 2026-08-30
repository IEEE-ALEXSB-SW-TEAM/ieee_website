import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "../supabase-client";
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

    const handleRegister = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        // Check passwords
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);

        try {
            const { data, error } = await supabase.auth.signUp({
                email: email.trim(),
                password,
                options: {
                    data: {
                        username: username.trim(),
                    },
                },
            });

            if (error) {
                setError(error.message);
                return;
            }

            // If account already exists with email confirmation enabled,
            // Supabase returns an empty identities array to avoid leaking user info.
            if (data?.user?.identities && data.user.identities.length === 0) {
                setError("An account with this email already exists.");
                return;
            }

            if (data?.session) {
                // User logged in immediately (e.g. email confirmation disabled)
                navigate("/");
            } else {
                // Email confirmation required
                setSuccess("Registration successful! Please check your email to verify your account.");
            }
        } catch (err) {
            console.error("Error:", err);
            setError("An unexpected error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

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