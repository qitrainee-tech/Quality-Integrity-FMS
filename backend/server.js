import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import multer from 'multer';
import archiver from 'archiver';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Hardcoded reCAPTCHA Secret Key (for development)
const RECAPTCHA_SECRET_KEY = '6LcjmmgsAAAAAPoAIAUdWF4biXjW1sjm7cinWODo';

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Multer (memory storage) for file uploads (store in DB as BLOB)
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 200 * 1024 * 1024 } }); // 200MB limit

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
    const { email, password, recaptchaToken } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }

    // Verify reCAPTCHA token if provided
    if (recaptchaToken) {
      try {
        const verificationUrl = 'https://www.google.com/recaptcha/api/siteverify';
        const recaptchaResponse = await fetch(verificationUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            secret: RECAPTCHA_SECRET_KEY,
            response: recaptchaToken,
          }),
        });

        const recaptchaData = await recaptchaResponse.json();
        console.log('reCAPTCHA response:', recaptchaData);

        // Check reCAPTCHA score and success - BLOCK login if failed
        if (!recaptchaData.success || recaptchaData.score < 0.5) {
          console.warn('❌ reCAPTCHA verification failed. Success:', recaptchaData.success, 'Score:', recaptchaData.score);
          return res.status(400).json({ 
            success: false, 
            message: 'reCAPTCHA verification failed. Please try again.' 
          });
        } else {
          console.log('✓ reCAPTCHA verified successfully, score:', recaptchaData.score);
        }
      } catch (recaptchaErr) {
        console.error('reCAPTCHA verification error:', recaptchaErr);
        return res.status(500).json({ 
          success: false, 
          message: 'Server error during verification' 
        });
      }
    } else {
      console.warn('⚠ reCAPTCHA token not provided');
    }

    // Get connection from pool
    const connection = await pool.getConnection();

    // Query user by email
    const [rows] = await connection.query(
      'SELECT id, email, password, name, role, department, status FROM users WHERE email = ?',
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

    // Check if user is inactive
    if (user.status === 'Inactive') {
      return res.status(403).json({ 
        success: false, 
        message: 'This account has been deactivated. Please contact an administrator.' 
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
        role: user.role,
        department: user.department
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
    const { email, password, name, adminId, role, department, status } = req.body;

    if (!email || !name || !adminId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email, name and adminId are required' 
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

    // If password not provided, generate a temporary one
    const plainPassword = password || Math.random().toString(36).slice(-10) || 'TempPass123';
    // Hash password
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // Determine role/department/status defaults
    const newRole = role === 'Admin' ? 'admin' : 'user';
    const newDepartment = department || 'General';
    const newStatus = status || 'Active';

    // Insert new user and get insertId
    const [result] = await connection.query(
      'INSERT INTO users (email, password, name, role, department, status) VALUES (?, ?, ?, ?, ?, ?)',
      [email, hashedPassword, name, newRole, newDepartment, newStatus]
    );

    connection.release();

    res.status(201).json({ 
      success: true, 
      message: 'User created successfully',
      user: {
        id: result.insertId,
        email,
        name,
        role: newRole,
        department: newDepartment,
        status: newStatus,
        tempPassword: password ? null : plainPassword
      }
    });

  } catch (error) {
    console.error('Create User Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error. Please try again later.' 
    });
  }
});

// Update User Route (Admin or self)
app.put('/api/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, email, role, department, status, password } = req.body;
    const adminId = req.query.adminId;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID required' });
    }

    const connection = await pool.getConnection();

    // If adminId provided and is not the same as userId, verify admin
    if (adminId && parseInt(adminId) !== parseInt(userId)) {
      const [adminUser] = await connection.query(
        'SELECT role FROM users WHERE id = ? AND role = "admin"',
        [adminId]
      );
      if (adminUser.length === 0) {
        connection.release();
        return res.status(403).json({ success: false, message: 'Only admins can update other users' });
      }
    }

    // Build update dynamically
    const fields = [];
    const params = [];
    if (name) { fields.push('name = ?'); params.push(name); }
    if (email) { fields.push('email = ?'); params.push(email); }
    if (role) { fields.push('role = ?'); params.push(role === 'Admin' ? 'admin' : 'user'); }
    if (department) { fields.push('department = ?'); params.push(department); }
    if (status) { fields.push('status = ?'); params.push(status); }
    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      fields.push('password = ?'); params.push(hashed);
    }

    if (fields.length === 0) {
      connection.release();
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    params.push(userId);
    const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
    const [result] = await connection.query(sql, params);

    connection.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, message: 'User updated successfully' });
  } catch (error) {
    console.error('Update User Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
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


    // Get all users (include department and status)
    const [users] = await connection.query(
      'SELECT id, email, name, role, department, status, created_at FROM users'
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

    // Set user status to Inactive instead of deleting
    const [result] = await connection.query(
      'UPDATE users SET status = ? WHERE id = ? AND role = "user"',
      ['Inactive', userId]
    );
    

    console.log('Deactivate result:', result);

    connection.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found or is not a regular user' 
      });
    }

    res.json({ 
      success: true, 
      message: 'User deactivated successfully' 
    });

  } catch (error) {
    console.error('Delete User Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error: ' + error.message 
    });
  }
});

// Document upload route (multiple files in one row)
app.post('/api/documents/upload', upload.array('document'), async (req, res) => {
  try {
    const { document_name, category, department, description, uploaded_by, access_level } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }

    const connection = await pool.getConnection();

    try {
      // Determine uploader id and name (store both: id for relation, name for human-readability)
      let uploadedByName = null;
      let uploadedById = null;
      if (uploaded_by) {
        const userId = parseInt(uploaded_by, 10);
        uploadedById = Number.isNaN(userId) ? null : userId;
        if (uploadedById) {
          const [userRows] = await connection.query(
            'SELECT name FROM users WHERE id = ?',
            [uploadedById]
          );
          if (userRows.length > 0) uploadedByName = userRows[0].name;
        }
      }

      // Prepare file metadata and aggregate data
      const filesData = [];
      let totalSize = 0;
      const mimeTypes = [];

      for (const file of req.files) {
        console.log('Processing file:', file.originalname, 'Size:', file.size, 'Type:', file.mimetype);
        
        // Convert buffer to base64 for JSON serialization
        const base64Data = file.buffer.toString('base64');
        
        filesData.push({
          name: file.originalname,
          type: file.mimetype,
          size: file.size,
          data: base64Data
        });
        
        totalSize += file.size;
        
        if (!mimeTypes.includes(file.mimetype)) {
          mimeTypes.push(file.mimetype);
        }
      }

      // Serialize all file data as JSON
      const filesJson = JSON.stringify(filesData);
      const typesJson = JSON.stringify(mimeTypes);

      console.log('Aggregated upload:', {
        document_name,
        category,
        department,
        description,
        totalSize,
        fileCount: req.files.length,
        mimeTypes,
        uploadedBy: uploadedByName
      });

      // Single insert with all files in one row
      // include access_level if provided (default to 'Admin Only')
      const sql = 'INSERT INTO documents_tbl (document_name, category, department, description, document_size, document_type, uploaded_by, uploaded_by_id, document_blob, access_level) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
      const params = [
        document_name || null,
        category || null,
        department || null,
        description || null,
        totalSize,
        typesJson,
        uploadedByName,
        uploadedById,
        filesJson,
        access_level || 'Admin Only'
      ];

      const [result] = await connection.query(sql, params);
      connection.release();

      console.log('Single insert result:', result.insertId, 'Files:', req.files.length);
      res.status(201).json({ 
        success: true, 
        message: `${req.files.length} file(s) uploaded successfully in one record`, 
        id: result.insertId,
        fileCount: req.files.length
      });
    } catch (err) {
      connection.release();
      console.error('DB insert error:', err && err.message ? err.message : err);
      res.status(500).json({ success: false, message: 'Database error while saving documents', error: err && err.message ? err.message : String(err) });
    }
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ success: false, message: 'Server error during upload' });
  }
});

// List documents (metadata only)
app.get('/api/documents', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    // If a userId is provided, check if user is admin; non-admins only get Public documents from their own department
    const userId = req.query.userId;
    let rows;
    if (userId) {
      const [userRows] = await connection.query('SELECT role, department FROM users WHERE id = ?', [userId]);
      const isAdmin = userRows.length > 0 && userRows[0].role === 'admin';
      const userDepartment = userRows.length > 0 ? userRows[0].department : null;
      
      if (isAdmin) {
        // Admins see all documents; include uploader name by joining users
        [rows] = await connection.query(
          'SELECT d.id, d.document_name, d.category, d.department, d.description, d.document_size, d.document_type, d.uploaded_by_id, u.name AS uploaded_by, d.uploaded_at, d.access_level FROM documents_tbl d LEFT JOIN users u ON d.uploaded_by_id = u.id ORDER BY d.uploaded_at DESC'
        );
      } else {
        // Non-admins see only Public documents from their own department OR Global documents
        [rows] = await connection.query(
          'SELECT d.id, d.document_name, d.category, d.department, d.description, d.document_size, d.document_type, d.uploaded_by_id, u.name AS uploaded_by, d.uploaded_at, d.access_level FROM documents_tbl d LEFT JOIN users u ON d.uploaded_by_id = u.id WHERE d.access_level = ? AND (d.department = ? OR d.department = ?) ORDER BY d.uploaded_at DESC',
          ['Public', userDepartment, 'Global']
        );
      }
    } else {
      // No user specified: return only public documents from all departments (for anonymous access)
      [rows] = await connection.query('SELECT d.id, d.document_name, d.category, d.department, d.description, d.document_size, d.document_type, d.uploaded_by_id, u.name AS uploaded_by, d.uploaded_at, d.access_level FROM documents_tbl d LEFT JOIN users u ON d.uploaded_by_id = u.id WHERE d.access_level = ? ORDER BY d.uploaded_at DESC', ['Public']);
    }
    connection.release();
    res.json({ success: true, documents: rows });
  } catch (err) {
    console.error('List documents error:', err);
    res.status(500).json({ success: false, message: 'Unable to list documents' });
  }
});

// Download document blob by id (returns file list or individual file)
app.get('/api/documents/:id/download', async (req, res) => {
  try {
    const { id } = req.params;
    const { fileIndex } = req.query; // optional: specify which file to download (0-based)
    
    const connection = await pool.getConnection();
    const [rows] = await connection.query(
      'SELECT d.document_name, d.document_type, d.document_size, d.document_blob, d.uploaded_by_id, u.name AS uploaded_by FROM documents_tbl d LEFT JOIN users u ON d.uploaded_by_id = u.id WHERE d.id = ?',
      [id]
    );
    connection.release();

    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    const doc = rows[0];
    const blobData = doc.document_blob;
    
    if (!blobData) {
      return res.status(404).json({ success: false, message: 'Document content not found' });
    }

    let filesData;
    try {
      // Parse JSON blob to get files array
      const blobStr = blobData.toString('utf8');
      filesData = JSON.parse(blobStr);
    } catch (e) {
      // Fallback: treat as legacy binary blob
      console.log('Could not parse as JSON, treating as binary blob');
      const mime = doc.document_type || 'application/octet-stream';
      const filename = doc.document_name || `document-${id}`;
      const size = doc.document_size || blobData.length;

      res.setHeader('Content-Type', mime);
      res.setHeader('Content-Length', size);
      res.setHeader('Content-Disposition', `attachment; filename="${filename.replace(/\"/g, '')}"`);
      return res.send(blobData);
    }

    // If fileIndex is specified, download single file
    if (fileIndex !== undefined) {
      const idx = parseInt(fileIndex, 10);
      if (!Array.isArray(filesData) || !filesData[idx]) {
        return res.status(404).json({ success: false, message: 'File not found in record' });
      }

      const file = filesData[idx];
      const buffer = Buffer.from(file.data, 'base64');

      res.setHeader('Content-Type', file.type || 'application/octet-stream');
      res.setHeader('Content-Length', buffer.length);
      res.setHeader('Content-Disposition', `attachment; filename="${file.name.replace(/\"/g, '')}"`);
      return res.send(buffer);
    }

    // If no fileIndex, return list of files in record
    if (Array.isArray(filesData)) {
      const fileList = filesData.map((f, idx) => ({
        index: idx,
        name: f.name,
        type: f.type,
        size: f.size
      }));
      return res.json({ 
        success: true, 
        documentId: id,
        documentName: doc.document_name,
        uploadedBy: doc.uploaded_by,
        totalSize: doc.document_size,
        files: fileList 
      });
    }

    // Fallback: return as single blob
    const mime = (Array.isArray(doc.document_type) ? doc.document_type[0] : doc.document_type) || 'application/octet-stream';
    const filename = doc.document_name || `document-${id}`;
    res.setHeader('Content-Type', mime);
    res.setHeader('Content-Length', doc.document_size || blobData.length);
    res.setHeader('Content-Disposition', `attachment; filename="${filename.replace(/\"/g, '')}"`);
    return res.send(blobData);
  } catch (err) {
    console.error('Download document error:', err);
    res.status(500).json({ success: false, message: 'Unable to download document' });
  }
});

// Download all files in a document as ZIP
app.get('/api/documents/:id/download-zip', async (req, res) => {
  try {
    const { id } = req.params;
    
    const connection = await pool.getConnection();
    const [rows] = await connection.query(
      'SELECT document_name, document_blob FROM documents_tbl WHERE id = ?',
      [id]
    );
    connection.release();

    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    const doc = rows[0];
    const blobData = doc.document_blob;
    
    if (!blobData) {
      return res.status(404).json({ success: false, message: 'Document content not found' });
    }

    let filesData;
    try {
      const blobStr = blobData.toString('utf8');
      filesData = JSON.parse(blobStr);
    } catch (e) {
      console.log('Could not parse as JSON, treating as binary blob');
      filesData = [];
    }

    if (!Array.isArray(filesData) || filesData.length === 0) {
      return res.status(400).json({ success: false, message: 'No files to download' });
    }

    // Create zip archive
    const archive = archiver('zip', { zlib: { level: 9 } });
    const filename = (doc.document_name || `document-${id}`).replace(/[^a-z0-9]/gi, '_').toLowerCase();
    
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.zip"`);
    
    archive.pipe(res);

    // Add each file to the zip
    filesData.forEach((file, idx) => {
      const buffer = Buffer.from(file.data, 'base64');
      archive.append(buffer, { name: file.name });
    });

    archive.finalize();

    archive.on('error', (err) => {
      console.error('Archive error:', err);
      res.status(500).json({ success: false, message: 'Error creating zip file' });
    });
  } catch (err) {
    console.error('Download zip error:', err);
    res.status(500).json({ success: false, message: 'Unable to download zip' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
});

// Dashboard stats endpoint
app.get('/api/dashboard', async (req, res) => {
  try {
    const userId = req.query.userId;
    const connection = await pool.getConnection();

    let isAdmin = false;
    let userDept = null;
    if (userId) {
      const [userRows] = await connection.query('SELECT role, department FROM users WHERE id = ?', [userId]);
      if (userRows.length > 0) {
        isAdmin = userRows[0].role === 'admin';
        userDept = userRows[0].department;
      }
    }

    // Helper to compute percent change
    const computeChange = (curr, prev) => {
      if (prev === 0) return curr > 0 ? '+100%' : '0%';
      const pct = ((curr - prev) / prev * 100).toFixed(0);
      return pct >= 0 ? `+${pct}%` : `${pct}%`;
    };

    if (isAdmin) {
      // Today's stats
      const [todayRows] = await connection.query(
        "SELECT COUNT(*) AS totalFiles, IFNULL(SUM(document_size),0) AS storageUsed, SUM(CASE WHEN DATE(uploaded_at)=CURDATE() THEN 1 ELSE 0 END) AS uploadsToday FROM documents_tbl"
      );
      // Yesterday's stats
      const [yesterdayRows] = await connection.query(
        "SELECT COUNT(*) AS totalFiles, IFNULL(SUM(document_size),0) AS storageUsed FROM documents_tbl WHERE DATE(uploaded_at) <= DATE_SUB(CURDATE(), INTERVAL 1 DAY)"
      );
      const [uRows] = await connection.query("SELECT COUNT(*) AS activeUsers FROM users WHERE status = 'Active'");
      
      const today = { ...todayRows[0], ...uRows[0] };
      const yesterday = yesterdayRows[0];

      connection.release();

      res.json({
        success: true,
        stats: {
          totalFiles: Number(today.totalFiles) || 0,
          totalFilesChange: computeChange(Number(today.totalFiles) || 0, Number(yesterday.totalFiles) || 0),
          storageUsed: Number(today.storageUsed) || 0,
          storageUsedChange: computeChange(Number(today.storageUsed) || 0, Number(yesterday.storageUsed) || 0),
          uploadsToday: Number(today.uploadsToday) || 0,
          uploadsTodayChange: '+8%', // Placeholder since we don't have yesterday's uploads
          activeUsers: Number(today.activeUsers) || 0,
          activeUsersChange: 'Stable'
        }
      });
    } else {
      // Today's stats
      const [todayRows] = await connection.query(
        "SELECT COUNT(*) AS totalFiles, IFNULL(SUM(document_size),0) AS storageUsed, SUM(CASE WHEN DATE(uploaded_at)=CURDATE() THEN 1 ELSE 0 END) AS uploadsToday FROM documents_tbl WHERE access_level = ? AND department = ?",
        ['Public', userDept]
      );
      // Yesterday's stats
      const [yesterdayRows] = await connection.query(
        "SELECT COUNT(*) AS totalFiles, IFNULL(SUM(document_size),0) AS storageUsed FROM documents_tbl WHERE access_level = ? AND department = ? AND DATE(uploaded_at) <= DATE_SUB(CURDATE(), INTERVAL 1 DAY)",
        ['Public', userDept]
      );
      const [uRows] = await connection.query("SELECT COUNT(*) AS activeUsers FROM users WHERE status = 'Active' AND department = ?", [userDept]);
      
      const today = { ...todayRows[0], ...uRows[0] };
      const yesterday = yesterdayRows[0];

      connection.release();

      res.json({
        success: true,
        stats: {
          totalFiles: Number(today.totalFiles) || 0,
          totalFilesChange: computeChange(Number(today.totalFiles) || 0, Number(yesterday.totalFiles) || 0),
          storageUsed: Number(today.storageUsed) || 0,
          storageUsedChange: computeChange(Number(today.storageUsed) || 0, Number(yesterday.storageUsed) || 0),
          uploadsToday: Number(today.uploadsToday) || 0,
          uploadsTodayChange: '+8%',
          activeUsers: Number(today.activeUsers) || 0,
          activeUsersChange: 'Stable'
        }
      });
    }
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ success: false, message: 'Unable to fetch dashboard stats' });
  }
});

// Upload trends endpoint (last 7 or 30 days)
app.get('/api/upload-trends', async (req, res) => {
  try {
    const userId = req.query.userId;
    const period = parseInt(req.query.period) || 7; // 7 or 30 days
    const connection = await pool.getConnection();

    let isAdmin = false;
    let userDept = null;
    if (userId) {
      const [userRows] = await connection.query('SELECT role, department FROM users WHERE id = ?', [userId]);
      if (userRows.length > 0) {
        isAdmin = userRows[0].role === 'admin';
        userDept = userRows[0].department;
      }
    }

    const trends = [];

    if (period === 30) {
      // Last 30 days: group by week or show every other day
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const month = date.toLocaleDateString('en-US', { month: 'short' });
        const day = date.getDate();
        const label = `${month} ${day}`;

        let query, params;
        if (isAdmin) {
          query = "SELECT COUNT(*) AS uploads, IFNULL(SUM(document_size),0) AS size FROM documents_tbl WHERE DATE(uploaded_at) = ?";
          params = [dateStr];
        } else {
          query = "SELECT COUNT(*) AS uploads, IFNULL(SUM(document_size),0) AS size FROM documents_tbl WHERE DATE(uploaded_at) = ? AND access_level = ? AND department = ?";
          params = [dateStr, 'Public', userDept];
        }

        const [rows] = await connection.query(query, params);
        trends.push({
          name: label,
          uploads: Number(rows[0]?.uploads || 0),
          size: Number(rows[0]?.size || 0)
        });
      }
    } else {
      // Last 7 days
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayName = days[date.getDay()];

        let query, params;
        if (isAdmin) {
          query = "SELECT COUNT(*) AS uploads, IFNULL(SUM(document_size),0) AS size FROM documents_tbl WHERE DATE(uploaded_at) = ?";
          params = [dateStr];
        } else {
          query = "SELECT COUNT(*) AS uploads, IFNULL(SUM(document_size),0) AS size FROM documents_tbl WHERE DATE(uploaded_at) = ? AND access_level = ? AND department = ?";
          params = [dateStr, 'Public', userDept];
        }

        const [rows] = await connection.query(query, params);
        trends.push({
          name: dayName,
          uploads: Number(rows[0]?.uploads || 0),
          size: Number(rows[0]?.size || 0)
        });
      }
    }

    connection.release();

    res.json({
      success: true,
      trends
    });
  } catch (err) {
    console.error('Upload trends error:', err);
    res.status(500).json({ success: false, message: 'Unable to fetch upload trends' });
  }
});
