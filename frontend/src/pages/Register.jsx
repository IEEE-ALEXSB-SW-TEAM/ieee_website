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
    const [loading, setLoading] = useState(false);

    const handleRegister = async (e) => {
        e.preventDefault();

        setError("");

        // Check passwords
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);

        try {
            const { error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: username,
                    },
                },
            });

            if (signUpError) {
                setError(signUpError.message);
            } else {
                // Registration successful
                navigate("/login");
            }
        } catch (err) {
            console.error("Error:", err);
            setError("Cannot connect to the server.");
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
                    <p className="error-message">
                        {error}
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