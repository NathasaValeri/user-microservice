// auth-service.js
const express = require('express');
const mysql = require('mysql2/promise');
// const bcrypt = require('bcryptjs'); // Hapus impor bcrypt
const jwt = require('jsonwebtoken'); 
require('dotenv').config(); 

const app = express();
const AUTH_PORT = 3001;

// --- Konfigurasi JWT (dengan Fallback untuk menghindari error 'secretOrPrivateKey') ---
const JWT_SECRET = process.env.JWT_SECRET || 'KATA_KUNCI_RAHASIA_ANDA_YANG_SANGAT_KUAT_12345'; 

// --- Konfigurasi Database ---
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root', 
    password: '', 
    database: 'data_user' 
});

// --- Middleware ---
app.use(express.json()); 

// =================================================================
// 📝 ENDPOINT REGISTRASI (POST /auth/register)
// =================================================================
app.post('/auth/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        // PERHATIAN: Menyimpan password ASLI (PLAINTEXT)
        // Hapus bcrypt.hash
        const [result] = await pool.execute(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
            [username, email, password] // Menyimpan password ASLI
        );
        res.status(201).json({ message: 'Registrasi berhasil', userId: result.insertId });
    } catch (error) {
        console.error('Error saat registrasi:', error);
        res.status(500).json({ message: 'Registrasi gagal karena masalah server.' });
    }
});


// =================================================================
// 🔑 ENDPOINT LOGIN (POST /auth/login)
// =================================================================
app.post('/auth/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const [rows] = await pool.execute(
            'SELECT user_id, username, password FROM users WHERE username = ?', 
            [username]
        );

        if (rows.length === 0) {
            return res.status(401).json({ message: 'Username atau password salah.' });
        }

        const user = rows[0];
        
        // PERUBAHAN: Membandingkan password ASLI (PLAINTEXT)
        // Ganti bcrypt.compare menjadi perbandingan string biasa
        if (password !== user.password) {
            return res.status(401).json({ message: 'Username atau password salah.' });
        }

        const token = jwt.sign(
            { id: user.user_id, username: user.username },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({ token });
    } catch (error) {
        console.error('Error saat login:', error);
        res.status(500).json({ message: 'Gagal login karena masalah server.' });
    }
});

// --- Server Listener ---
app.listen(AUTH_PORT, () => {
    console.log(`✅ Auth Microservice berjalan di port ${AUTH_PORT}`);
});
