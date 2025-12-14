// gateway.js
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const jwt = require('jsonwebtoken'); 
require('dotenv').config(); 

const app = express();
const PORT = 3000;

// --- KONSTANTA PENTING ---
const JWT_SECRET = process.env.JWT_SECRET;

// --- Middleware ---
app.use(cors()); 
app.use(express.json());

// --- Fungsi Otorisasi Middleware ---
function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Akses ditolak. Token tidak tersedia.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ message: 'Token tidak valid atau kedaluwarsa.' });
    }
}

// =================================================================
// 🔑 PROXY KE AUTH SERVICE (Port 3001)
// =================================================================
app.post('/auth/register', async (req, res) => {
    try {
        const response = await axios.post('http://localhost:3001/auth/register', req.body);
        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json(error.response?.data || { message: "Gagal proxy ke Auth Service." });
    }
});

app.post('/auth/login', async (req, res) => {
    try {
        const response = await axios.post('http://localhost:3001/auth/login', req.body);
        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json(error.response?.data || { message: "Gagal proxy ke Auth Service." });
    }
});


// =================================================================
// 🔍 PROXY KE USER SERVICE (Port 3002)
// =================================================================

// Endpoint BARU: GET /users (Mengambil SEMUA pengguna)
app.get('/users', verifyToken, async (req, res) => {
    try {
        const response = await axios.get(`http://localhost:3002/users`, {
            headers: { Authorization: req.headers.authorization }
        });
        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json(error.response?.data || { message: "Gagal proxy ke User Service." });
    }
});

// Endpoint LAMA: GET /users/:id (Mengambil SATU pengguna)
app.get('/users/:id', verifyToken, async (req, res) => {
    const userId = req.params.id;
    try {
        const response = await axios.get(`http://localhost:3002/users/${userId}`, {
            headers: { Authorization: req.headers.authorization }
        });
        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json(error.response?.data || { message: "Gagal proxy ke User Service." });
    }
});


// --- Server Listener ---
app.listen(PORT, () => {
    console.log(`API Gateway berjalan di http://localhost:3000`);
});
