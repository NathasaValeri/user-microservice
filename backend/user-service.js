// user-service.js
const express = require('express');
const mysql = require('mysql2/promise');
const app = express();
const USER_PORT = 3002;

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
// 🔍 ENDPOINT AMBIL SEMUA PENGGUNA (GET /users) - ADMIN VIEW
// =================================================================
app.get('/users', async (req, res) => {
    try {
        // PERBAIKAN: Menggunakan pool.execute
        // Query mengambil SEMUA data pengguna, termasuk password ASLI.
        const [rows] = await pool.execute( 
            'SELECT user_id, username, email, password FROM users'
        );
        
        res.status(200).json({ data: rows }); // Mengirimkan array
    } catch (error) {
        console.error('Error mengambil semua user:', error);
        res.status(500).json({ message: 'Error server saat mengambil semua pengguna.' });
    }
});

// Endpoint GET /users/:id (Dipertahankan untuk kompatibilitas)
app.get('/users/:id', async (req, res) => {
    const userId = req.params.id;
    try {
        const [rows] = await pool.execute(
            'SELECT user_id, username, email, password FROM users WHERE user_id = ?', 
            [userId]
        );
        if (rows.length > 0) {
            res.status(200).json({ data: rows[0] });
        } else {
            res.status(404).json({ message: 'User tidak ditemukan' });
        }
    } catch (error) {
        console.error('Database query error:', error);
        res.status(500).json({ message: 'Error mengambil data dari database.' });
    }
});


// --- Server Listener ---
app.listen(USER_PORT, () => {
    console.log(`✅ User Microservice berjalan di port ${USER_PORT}`);
});
