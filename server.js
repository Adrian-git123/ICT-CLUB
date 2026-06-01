const express = require('express');
const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
const session = require('express-session');
const path = require('path');

const app = express();
const db = new Database('ictclub.db');

// --- DATABASE TABLES CREATION ---
// 1. Table for accounts
db.prepare(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT
    )
`).run();

// 2. Table for newsletters
db.prepare(`
    CREATE TABLE IF NOT EXISTS subscribers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fullname TEXT,
        email TEXT UNIQUE
    )
`).run();

// --- MIDDLEWARE CONFIGURATION ---
app.use(express.urlencoded({ extended: true }));
// Let express serve your stylesheet and images folders directly
app.use(express.static(__dirname)); 

app.use(session({
    secret: 'kapsabet_excellence_key',
    resave: false,
    saveUninitialized: false
}));

// --- ROUTES ---

// Main Home Page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// GET: Display Registration View
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'register.html'));
});

// GET: Display Login View
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

// FEATURE 1: Newsletter Form Backend Logic
app.post('/newsletter-subscribe', (req, res) => {
    const { fullname, email } = req.body;
    
    try {
        const saveSubscriber = db.prepare('INSERT INTO subscribers (fullname, email) VALUES (?, ?)');
        saveSubscriber.run(fullname, email);
        
        res.send("<script>alert('Awesome! Thank you for subscribing to our newsletter!'); window.location='/';</script>");
    } catch (error) {
        // Keeps page interactive if email is already stored in database
        res.send("<script>alert('This email is already subscribed!'); window.location='/';</script>");
    }
});

// FEATURE 2: Sign Up Account Creation
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const securePassword = await bcrypt.hash(password, 10);

    try {
        const createAccount = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)');
        createAccount.run(username, securePassword);
        
        res.send("<script>alert('Account created! Proceed to Login.'); window.location='/login';</script>");
    } catch (error) {
        res.send("<script>alert('Username is already taken!'); window.location='/register';</script>");
    }
});

// FEATURE 2: Login Verification
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    
    if (user && await bcrypt.compare(password, user.password)) {
        req.session.user = user.username;
        res.send(`<h1>Welcome back to the Kapsabet ICT Club Portal, ${username}! Login Successful.</h1><br><a href="/">Return Home</a>`);
    } else {
        res.send("<script>alert('Invalid username or password.'); window.location='/login';</script>");
    }
});

app.listen(3000, () => {
    console.log("ICT Club Server initialized on http://localhost:3000");
});