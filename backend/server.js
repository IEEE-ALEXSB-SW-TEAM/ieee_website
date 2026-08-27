const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();

const PORT = 5000;
const JWT_SECRET = "ieee_website_secret";

app.use(cors());
app.use(express.json());

// Temporary database
const users = [];

// =========================
// HOME / TEST
// =========================

app.get("/", (req, res) => {
    res.json({
        status: "ok",
        message: "IEEE backend is running"
    });
});

// =========================
// REGISTER
// =========================

app.post("/register", async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({
                status: "error",
                error: "All fields are required"
            });
        }

        // Check account
        const existingUser = users.find(
            user => user.email === email.toLowerCase()
        );

        if (existingUser) {
            return res.status(400).json({
                status: "error",
                error: "Account already exists"
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = {
            id: users.length + 1,
            username,
            email: email.toLowerCase(),
            password: hashedPassword
        };

        users.push(newUser);

        console.log("New account:", email);

        res.json({
            status: "ok",
            message: "Account created successfully"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            status: "error",
            error: "Server error"
        });
    }
});

// =========================
// LOGIN
// =========================

app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                status: "error",
                error: "Email and password are required"
            });
        }

        // Find account
        const user = users.find(
            user => user.email === email.toLowerCase()
        );

        if (!user) {
            return res.status(401).json({
                status: "error",
                error: "Account does not exist"
            });
        }

        // Check password
        const passwordCorrect = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordCorrect) {
            return res.status(401).json({
                status: "error",
                error: "Incorrect password"
            });
        }

        // Create token
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email
            },
            JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );

        res.json({
            status: "ok",
            token
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            status: "error",
            error: "Server error"
        });
    }
});

// =========================
// START SERVER
// =========================

app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
});