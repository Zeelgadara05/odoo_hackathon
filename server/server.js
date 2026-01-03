const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const jwt = require('jsonwebtoken');
const md5 = require('md5');
const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 5000;
const SECRET_KEY = "dayflow_secret_hrms";

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- FILE UPLOAD ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = './uploads';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir);
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// --- EMAIL ---
let transporter;
nodemailer.createTestAccount().then((account) => {
    transporter = nodemailer.createTransport({
        host: account.smtp.host,
        port: account.smtp.port,
        secure: account.smtp.secure,
        auth: { user: account.user, pass: account.pass }
    });
    console.log("✉️  Email System Ready (Ethereal Mock)");
});

const sendEmail = async (to, subject, html) => {
    if (!transporter) return;
    try {
        let info = await transporter.sendMail({ from: '"Dayflow System" <sys@dayflow.com>', to, subject, html });
        console.log(`[EMAIL] To: ${to} | Link: ${nodemailer.getTestMessageUrl(info)}`);
    } catch (e) { console.error(e); }
};

// --- DATABASE ---
const db = new sqlite3.Database('./dayflow.db', (err) => { if (err) console.error(err); });

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employeeId TEXT UNIQUE,
        name TEXT,
        email TEXT UNIQUE,
        password TEXT,
        role TEXT, 
        phone TEXT,
        address TEXT,
        jobTitle TEXT,
        department TEXT,
        salary INTEGER DEFAULT 0,
        joinDate TEXT,
        isVerified INTEGER DEFAULT 0,
        verificationToken TEXT,
        profilePic TEXT,
        document TEXT
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS attendance (id INTEGER PRIMARY KEY AUTOINCREMENT, userId INTEGER, date TEXT, status TEXT, checkIn TEXT, checkOut TEXT)`);
    db.run(`CREATE TABLE IF NOT EXISTS leaves (id INTEGER PRIMARY KEY AUTOINCREMENT, userId INTEGER, type TEXT, startDate TEXT, endDate TEXT, remarks TEXT, adminRemarks TEXT, status TEXT DEFAULT 'Pending')`);
    db.run(`CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, senderId INTEGER, senderName TEXT, receiverId INTEGER, receiverName TEXT, subject TEXT, body TEXT, date TEXT)`);
});

// --- MIDDLEWARE ---
const authenticate = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).json({ error: "No token" });
    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.status(500).json({ error: "Auth failed" });
        req.userId = decoded.id; req.userRole = decoded.role; next();
    });
};

// --- ROUTES ---

// 1. AUTH
app.post('/api/signup', (req, res) => {
    const { employeeId, name, email, password, role } = req.body;
    const token = md5(email + Date.now()); 
    const link = `http://localhost:3000/verify/${token}`;

    if(role === 'Admin') {
        db.get(`SELECT * FROM users WHERE role = 'Admin'`, (err, row) => {
            if(row) return res.status(403).json({error: "Admin exists."});
            createUser();
        });
    } else { createUser(); }

    function createUser() {
        // --- FIX: AUTO-ASSIGN DESIGNATION ---
        const defaultJobTitle = role === 'Admin' ? 'HR' : 'Employee';

        db.run(`INSERT INTO users (employeeId, name, email, password, role, salary, department, jobTitle, joinDate, verificationToken) VALUES (?,?,?,?,?,?,?,?,?,?)`, 
            [employeeId, name, email, md5(password), role, 0, "General", defaultJobTitle, new Date().toISOString().split('T')[0], token], 
            function(err) {
                if (err) return res.status(400).json({ error: "User exists" });
                sendEmail(email, "Verify Your Account", `<p>Welcome! Click here to verify: <a href="${link}">${link}</a></p>`);
                res.json({ message: "Registered. Please verify email." });
            }
        );
    }
});

app.post('/api/verify', (req, res) => {
    const { token } = req.body;
    db.get(`SELECT * FROM users WHERE verificationToken = ?`, [token], (err, user) => {
        if(!user) return res.status(400).json({error: "Invalid Token"});
        db.run(`UPDATE users SET isVerified = 1, verificationToken = NULL WHERE id = ?`, [user.id], () => {
            res.json({ message: "Verified" });
        });
    });
});

app.post('/api/login', (req, res) => {
    const { email, password, isAdminLogin } = req.body;
    db.get(`SELECT * FROM users WHERE email = ? AND password = ?`, [email, md5(password)], (err, user) => {
        if (!user) return res.status(401).json({ error: "Invalid Credentials" });
        if (user.isVerified === 0) return res.status(403).json({ error: "Email not verified. Check your backend console for the link." });
        if (isAdminLogin && user.role !== 'Admin') return res.status(403).json({ error: "Not an Admin" });
        
        const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, { expiresIn: '8h' });
        res.json({ token, user });
    });
});

// 2. FILES
app.post('/api/upload', authenticate, upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file" });
    const type = req.body.type; 
    const filePath = `http://localhost:5000/uploads/${req.file.filename}`;
    const col = type === 'profile' ? 'profilePic' : 'document';
    db.run(`UPDATE users SET ${col} = ? WHERE id = ?`, [filePath, req.userId], (err) => {
        res.json({ message: "Uploaded", path: filePath });
    });
});

// 3. ATTENDANCE
app.post('/api/attendance/mark-absent', authenticate, (req, res) => {
    if(req.userRole !== 'Admin') return res.status(403).json({error:"Unauthorized"});
    const today = new Date().toISOString().split('T')[0];
    db.all(`SELECT id FROM users WHERE id NOT IN (SELECT userId FROM attendance WHERE date = ?)`, [today], (err, rows) => {
        const stmt = db.prepare(`INSERT INTO attendance (userId, date, status, checkIn, checkOut) VALUES (?, ?, 'Absent', '-', '-')`);
        rows.forEach(u => stmt.run(u.id, today));
        stmt.finalize();
        res.json({ message: `Marked ${rows.length} users as Absent` });
    });
});

// ... Standard Routes ...
app.get('/api/users', authenticate, (req, res) => db.all(`SELECT * FROM users`, [], (err, rows) => res.json(rows)));
app.put('/api/users/:id', authenticate, (req, res) => { 
    const { name, phone, address, salary, department } = req.body;
    db.run(`UPDATE users SET name=?, phone=?, address=?, salary=?, department=? WHERE id=?`, [name, phone, address, salary, department, req.params.id], () => res.json({msg:"Updated"}));
});
app.post('/api/attendance/checkin', authenticate, (req, res) => {
    const { date, checkIn, type } = req.body;
    db.run(`INSERT INTO attendance (userId, date, status, checkIn) VALUES (?,?,?,?)`, [req.userId, date, type || 'Present', checkIn], () => res.json({ msg: "In" }));
});
app.put('/api/attendance/checkout', authenticate, (req, res) => {
    const { date, checkOut } = req.body;
    db.run(`UPDATE attendance SET checkOut = ? WHERE userId = ? AND date = ?`, [checkOut, req.userId, date], () => res.json({ msg: "Out" }));
});
app.get('/api/attendance', authenticate, (req, res) => {
    const sql = req.userRole === 'Admin' ? `SELECT a.*, u.name FROM attendance a JOIN users u ON a.userId = u.id ORDER BY date DESC` : `SELECT * FROM attendance WHERE userId = ? ORDER BY date DESC`;
    db.all(sql, req.userRole === 'Admin' ? [] : [req.userId], (err, rows) => res.json(rows));
});
app.get('/api/leaves', authenticate, (req, res) => {
    const sql = req.userRole === 'Admin' ? `SELECT l.*, u.name FROM leaves l JOIN users u ON l.userId = u.id` : `SELECT * FROM leaves WHERE userId = ?`;
    db.all(sql, req.userRole === 'Admin' ? [] : [req.userId], (err, rows) => res.json(rows));
});
app.post('/api/leaves', authenticate, (req, res) => {
    const { type, startDate, endDate, remarks } = req.body;
    db.run(`INSERT INTO leaves (userId, type, startDate, endDate, remarks) VALUES (?,?,?,?,?)`, [req.userId, type, startDate, endDate, remarks], () => res.json({msg:"Applied"}));
});
app.put('/api/leaves/:id', authenticate, (req, res) => {
    db.run(`UPDATE leaves SET status=?, adminRemarks=? WHERE id=?`, [req.body.status, req.body.adminRemarks, req.params.id], () => res.json({msg:"Updated"}));
});
app.get('/api/profile', authenticate, (req, res) => db.get(`SELECT * FROM users WHERE id = ?`, [req.userId], (err, row) => res.json(row)));
app.get('/api/messages', authenticate, (req, res) => db.all(`SELECT * FROM messages WHERE receiverId = ?`, [req.userId], (err, rows) => res.json(rows)));
app.post('/api/messages', authenticate, (req, res) => {
    const { senderName, receiverId, receiverName, subject, body } = req.body;
    db.run(`INSERT INTO messages (senderId, senderName, receiverId, receiverName, subject, body, date) VALUES (?,?,?,?,?,?,?)`, [req.userId, senderName, receiverId, receiverName, subject, body, new Date().toLocaleDateString()], () => res.json({msg:"Sent"}));
});
app.post('/api/reset-password', (req, res) => {
    const { email, employeeId, newPassword } = req.body;
    db.get(`SELECT * FROM users WHERE email = ? AND employeeId = ?`, [email, employeeId], (err, user) => {
        if (!user) return res.status(400).json({ error: "Verification Failed" });
        db.run(`UPDATE users SET password = ? WHERE id = ?`, [md5(newPassword), user.id], (err) => res.json({ message: "Password Reset" }));
    });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));