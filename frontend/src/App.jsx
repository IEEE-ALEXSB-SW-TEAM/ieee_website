import { Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Events from "./pages/Events";
import ProgramDetails from "./pages/ProgramDetails";
import OccurrenceDetails from "./pages/OccurrenceDetails";

import Navbar from "./components/NavBar.jsx";
import Footer from "./components/Footer.jsx";

function App() {
  return (
    <div>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Events */}
        <Route path="/events" element={<Events />} />
        <Route
          path="/events/:programSlug"
          element={<ProgramDetails />}
        />
        <Route
          path="/events/:programSlug/:occurrenceSlug"
          element={<OccurrenceDetails />}
        />
      </Routes>

      <Footer />
    </div>
  );
}

export default App;