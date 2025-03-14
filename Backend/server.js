import pg from 'pg';
const { Pool } = pg; 
import jwt from 'jsonwebtoken';
import express from 'express';
import path from 'path';
import bcrypt from 'bcrypt';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import cors from "cors"



const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 3001;

const dashBoardLink = "/index.html";
app.use(express.static(path.join(__dirname, './Frontend')));
app.use(express.urlencoded({ extended: true }));

app.use(express.json());
app.use(cors());


const JWT_SECRET = "MySecret";

const pool = new Pool({
  host: 'localhost',
  user: 'postgres',
  password: 'dbPost246',
  database: 'Facebook_Backend',
  port: 5432,
  max: 10,
  idleTimeoutMillis: 30000,
});

async function testConnection() {
  console.log('Testing database connection');
  try {
    const client = await pool.connect();
    console.log('Connected to PostgreSQL database!');
    client.release();
  } catch (err) {
    console.error('Error connecting to PostgreSQL:', err);
  }
}

// Middleware for JWT Authentication
const authenticateToken = (req, res, next) => {
  console.log('Authenticating token');
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    console.log('No token provided');
    return res.sendStatus(401);
  }

  console.log('Verifying token:', token);
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.log('Token verification failed:', err.message);
      return res.sendStatus(403);
    }
    console.log('Token verified, user:', user);
    req.user = user;
    next();
  });
};

// Register Endpoint
app.post('/register', async (req, res) => {
  console.log('Register endpoint hit');
  try {
    const { username, password, isAdmin } = req.body;
    console.log('Register request data - username:', username, 'password:', password, 'isAdmin:', isAdmin);
    
    console.log('Hashing password');
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Password hashed');

    
    console.log('Inserting user into database');
    const result = await pool.query(
      'INSERT INTO userfacebook (username, password, isAdmin) VALUES ($1, $2, $3) RETURNING *', 
      [username, hashedPassword, isAdmin]
    );
    console.log('User registered, result:', result.rows[0]);

    res.status(201).json({ message: 'User registered successfully' });
    console.log('Registration response sent');
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Login Endpoint
app.post('/login', async (req, res) => {
  console.log('Login endpoint hit');
  try {
    const { username, password } = req.body;
    console.log('Login request data - username:', username);

    console.log('Querying user from database');
    const result = await pool.query(
      'SELECT * FROM userfacebook WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      console.log('User not found');
      return res.status(401).json({ message: 'User Not Found' });
    }

    const user = result.rows[0];
    console.log('User found:', user.username);

    console.log('Comparing passwords');
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      console.log('Password mismatch');
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    console.log('Password matched');

    console.log('Generating JWT');
    const token = jwt.sign({ userId: user.id, username: user.username, isAdmin: user.isAdmin }, JWT_SECRET, {
      expiresIn: '1h',
    });
    console.log('JWT generated:', token);

    res.json({ token });
    console.log('Login response sent with token');
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get User by ID (Protected Endpoint)
app.get('/users/:id', authenticateToken, async (req, res) => {
  console.log('Get user endpoint hit, ID:', req.params.id);
  try {
    const userId = req.params.id;
    console.log('Querying user by ID:', userId);
    
    const result = await pool.query(
      'SELECT id, username, isAdmin FROM userfacebook WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      console.log('User not found for ID:', userId);
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log('User retrieved:', result.rows[0]);
    res.json(result.rows[0]);
    console.log('User response sent');
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get Posts (Query Parameters)
app.get('/posts', async (req, res) => {
  console.log('Posts endpoint hit');
  try {
    console.log('Querying all posts');
    const result = await pool.query('SELECT * FROM posts');
    console.log('Posts retrieved, count:', result.rows.length);
    
    res.json(result.rows);
    console.log('Posts response sent');
  } catch (error) {
    console.error('Posts error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

testConnection();

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});