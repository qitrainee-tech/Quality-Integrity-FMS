import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MySQL Connection Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'pjg_hospital',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test database connection
pool.getConnection()
  .then(() => console.log('✓ MySQL Connected Successfully'))
  .catch(err => console.error('✗ Database Connection Error:', err));

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Login Route
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }

    // Get connection from pool
    const connection = await pool.getConnection();

    // Query user by email
    const [rows] = await connection.query(
      'SELECT id, email, password, name, role FROM users WHERE email = ?',
      [email]
    );

    connection.release();

    console.log('Login attempt - Email:', email);
    console.log('User found:', rows.length > 0);
    if (rows.length > 0) {
      console.log('Stored hash:', rows[0].password);
    }

    if (rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    const user = rows[0];

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('Password valid:', isPasswordValid);

    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // Successful login
    res.json({ 
      success: true, 
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error. Please try again later.' 
    });
  }
});

// Signup Route (optional)
app.post('/api/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required' 
      });
    }

    const connection = await pool.getConnection();

    // Check if user exists
    const [existingUser] = await connection.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUser.length > 0) {
      connection.release();
      return res.status(400).json({ 
        success: false, 
        message: 'Email already registered' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    await connection.query(
      'INSERT INTO users (email, password, name) VALUES (?, ?, ?)',
      [email, hashedPassword, name]
    );

    connection.release();

    res.status(201).json({ 
      success: true, 
      message: 'User registered successfully' 
    });

  } catch (error) {
    console.error('Signup Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error. Please try again later.' 
    });
  }
});

// Create User Route (Admin only)
app.post('/api/create-user', async (req, res) => {
  try {
    const { email, password, name, adminId } = req.body;

    if (!email || !password || !name || !adminId) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required' 
      });
    }

    const connection = await pool.getConnection();

    // Verify admin role
    const [adminUser] = await connection.query(
      'SELECT role FROM users WHERE id = ? AND role = "admin"',
      [adminId]
    );

    if (adminUser.length === 0) {
      connection.release();
      return res.status(403).json({ 
        success: false, 
        message: 'Only admins can create users' 
      });
    }

    // Check if user exists
    const [existingUser] = await connection.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUser.length > 0) {
      connection.release();
      return res.status(400).json({ 
        success: false, 
        message: 'Email already exists' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    await connection.query(
      'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, "user")',
      [email, hashedPassword, name]
    );

    connection.release();

    res.status(201).json({ 
      success: true, 
      message: 'User created successfully' 
    });

  } catch (error) {
    console.error('Create User Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error. Please try again later.' 
    });
  }
});

// Get All Users Route (Admin only)
app.get('/api/users', async (req, res) => {
  try {
    const adminId = req.query.adminId;

    if (!adminId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Admin ID required' 
      });
    }

    const connection = await pool.getConnection();

    // Verify admin role
    const [adminUser] = await connection.query(
      'SELECT role FROM users WHERE id = ? AND role = "admin"',
      [adminId]
    );

    if (adminUser.length === 0) {
      connection.release();
      return res.status(403).json({ 
        success: false, 
        message: 'Unauthorized' 
      });
    }

    // Get all users
    const [users] = await connection.query(
      'SELECT id, email, name, role, created_at FROM users'
    );

    connection.release();

    res.json({ 
      success: true, 
      users 
    });

  } catch (error) {
    console.error('Get Users Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Delete User Route (Admin only)
app.delete('/api/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const adminId = req.query.adminId;

    console.log('Delete request - userId:', userId, 'adminId:', adminId);

    if (!adminId || !userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Admin ID and User ID required' 
      });
    }

    const connection = await pool.getConnection();

    // Verify admin role
    const [adminUser] = await connection.query(
      'SELECT role FROM users WHERE id = ? AND role = "admin"',
      [adminId]
    );

    if (adminUser.length === 0) {
      connection.release();
      return res.status(403).json({ 
        success: false, 
        message: 'Only admins can delete users' 
      });
    }

    // Prevent deleting the admin account
    if (userId === adminId) {
      connection.release();
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete your own admin account' 
      });
    }

    // Delete user
    const [result] = await connection.query(
      'DELETE FROM users WHERE id = ? AND role = "user"',
      [userId]
    );

    console.log('Delete result:', result);

    connection.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found or is not a regular user' 
      });
    }

    res.json({ 
      success: true, 
      message: 'User deleted successfully' 
    });

  } catch (error) {
    console.error('Delete User Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error: ' + error.message 
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
});
