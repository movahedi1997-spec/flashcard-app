const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'users.json');

function ensureDb() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, '[]', 'utf-8');
}

function readUsers() {
  ensureDb();
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
}

function writeUsers(users) {
  ensureDb();
  fs.writeFileSync(DB_PATH, JSON.stringify(users, null, 2), 'utf-8');
}

function findByEmail(email) {
  return readUsers().find((u) => u.email === email) ?? null;
}

function findById(id) {
  return readUsers().find((u) => u.id === id) ?? null;
}

function createUser({ id, name, email, password }) {
  const users = readUsers();
  const user = { id, name, email, password, createdAt: new Date().toISOString() };
  users.push(user);
  writeUsers(users);
  return user;
}

module.exports = { findByEmail, findById, createUser };
