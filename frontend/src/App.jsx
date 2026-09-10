import { Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthProvider";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminDashboard from "./pages/AdminDashboard";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import Navbar from "./components/NavBar.jsx";
import Footer from "./components/Footer.jsx";

function App() {
    const location = useLocation();
    const isAdminRoute = location.pathname.startsWith("/admin");

    return (
        <AuthProvider>
            <div>
                <Navbar />
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route
                        path="/admin/*"
                        element={
                            <AdminProtectedRoute>
                                <AdminDashboard />
                            </AdminProtectedRoute>
                        }
                    />
                </Routes>
                {!isAdminRoute && <Footer />}
            </div>
        </AuthProvider>
    );
}

export default App;