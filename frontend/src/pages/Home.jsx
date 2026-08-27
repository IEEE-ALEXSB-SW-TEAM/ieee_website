import { Link } from "react-router-dom";

function Home() {
    return (
        <div>
            <h1>IEEE Website</h1>

            <p>Welcome to our website.</p>

            <Link to="/login">
                Login
            </Link>

            {" | "}

            <Link to="/register">
                Register
            </Link>
        </div>
    );
}

export default Home;