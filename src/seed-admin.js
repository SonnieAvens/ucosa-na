// Run: node src/seed-admin.js
require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./db');

const email = process.env.ADMIN_EMAIL || 'ucosa.northamerica@gmail.com';
const password = process.env.ADMIN_INIT_PASSWORD || 'Admin@ucosa2026';
const fullName = 'UCOSA Admin';

const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
if (existing) {
  console.log('Admin already exists:', email);
  process.exit(0);
}

const hash = bcrypt.hashSync(password, 10);
db.prepare('INSERT INTO users (full_name, email, password_hash, must_change_password, role) VALUES (?, ?, ?, 0, ?)')
  .run(fullName, email, hash, 'admin');

console.log('Admin created!');
console.log('Email:', email);
console.log('Password:', password);
console.log('CHANGE THIS PASSWORD after first login.');
process.exit(0);
