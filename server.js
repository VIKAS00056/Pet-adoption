// server.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const multer  = require('multer');
const cors = require('cors');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const Animal = require('./models/Animal');
const User = require('./models/User');
const Application = require('./models/Application');
const Feedback = require('./models/Feedback');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended:true }));

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/petadopt';
mongoose.connect(MONGO_URI, { useNewUrlParser:true, useUnifiedTopology:true })
  .then(()=> console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error', err));

// Multer setup (store files to /uploads)
const storage = multer.diskStorage({
  destination: (req,file,cb) => {
    const dir = path.join(__dirname,'uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req,file,cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + '-' + file.fieldname + ext);
  }
});
const upload = multer({ storage });

// ---- API ---- //

// Get all animals (with optional type filter)
app.get('/api/animals', async (req,res) => {
  try {
    const type = req.query.type;
    const filter = {};
    if(type) filter.type = type;
    const list = await Animal.find(filter).sort({ createdAt: -1 }).lean();
    res.json(list);
  } catch(err){
    res.status(500).json({ error: 'server error' });
  }
});

// Get single animal by id
app.get('/api/animals/:id', async (req,res) => {
  try{
    const a = await Animal.findById(req.params.id).lean();
    if(!a) return res.status(404).json({ error:'not found' });
    res.json(a);
  }catch(e){ res.status(400).json({ error:'invalid id' }); }
});

// Admin secret (use env var or default for demo)
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'supersecret';

// Create animal (admin) — supports image upload
app.post('/api/admin/animals', upload.single('photo'), async (req,res) => {
  const secret = req.headers['x-admin-secret'] || req.body.adminSecret;
  if(secret !== ADMIN_SECRET) return res.status(401).json({ error:'unauthorized' });

  const payload = {
    name: req.body.name,
    type: req.body.type,
    breed: req.body.breed,
    age: req.body.age,
    size: req.body.size,
    description: req.body.description,
    photo: req.file ? `/uploads/${req.file.filename}` : req.body.photo
  };
  const created = await Animal.create(payload);
  res.json(created);
});

// Update animal (admin)
app.put('/api/admin/animals/:id', upload.single('photo'), async (req,res) => {
  const secret = req.headers['x-admin-secret'] || req.body.adminSecret;
  if(secret !== ADMIN_SECRET) return res.status(401).json({ error:'unauthorized' });

  const update = { ...req.body };
  if(req.file) update.photo = `/uploads/${req.file.filename}`;
  const updated = await Animal.findByIdAndUpdate(req.params.id, update, { new:true });
  res.json(updated);
});

// Toggle adopted status
app.post('/api/admin/animals/:id/adopt', async (req,res) => {
  const secret = req.headers['x-admin-secret'] || req.body.adminSecret;
  if(secret !== ADMIN_SECRET) return res.status(401).json({ error:'unauthorized' });

  try {
    const animal = await Animal.findById(req.params.id);
    if(!animal) return res.status(404).json({ error:'animal not found' });

    // Toggle the adopted status (handle undefined/null as false)
    const currentStatus = animal.adopted === true;
    animal.adopted = !currentStatus;
    await animal.save();

    // Return as plain object to ensure proper JSON serialization
    res.json({
      _id: animal._id,
      name: animal.name,
      type: animal.type,
      breed: animal.breed,
      age: animal.age,
      size: animal.size,
      description: animal.description,
      photo: animal.photo,
      adopted: animal.adopted === true,
      createdAt: animal.createdAt
    });
  } catch(err) {
    console.error('Toggle adopted error', err);
    res.status(500).json({ error:'server error', details: err.message });
  }
});

// Application form submission (visitor)
app.post('/api/apply', async (req,res) => {
  try {
    const { animalId, name, email, message, userId } = req.body;
    if(!animalId) return res.status(400).json({ error:'missing animalId' });

    let finalName = name;
    let finalEmail = email;
    let userRef = undefined;

    if (userId) {
      const user = await User.findById(userId).lean();
      if (user) {
        userRef = user._id;
        finalName = user.name;
        finalEmail = user.email;
      }
    }

    if (!finalName || !finalEmail) {
      return res.status(400).json({ error:'missing user details' });
    }

    const application = await Application.create({
      animal: animalId,
      user: userRef,
      name: finalName,
      email: finalEmail,
      message,
    });

    res.json({ ok:true, message:'Application received', id: application._id });
  } catch(err){
    console.error('Application error', err);
    res.status(500).json({ error:'server error' });
  }
});

// Newsletter signup (demo: just log)
app.post('/api/newsletter', async (req,res) => {
  const { email } = req.body;
  if(!email) return res.status(400).json({ error:'missing email' });
  console.log('Newsletter signup:', email);
  res.json({ ok:true });
});

// Feedback submission
app.post('/api/feedback', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required' });
    }

    const feedback = await Feedback.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      message: message.trim(),
    });

    res.status(201).json({
      ok: true,
      message: 'Thank you for your feedback!',
      id: feedback._id,
    });
  } catch (err) {
    console.error('Feedback error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ---- Auth (login / signup) ---- //

// Signup
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password, mobile, address } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() }).lean();
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const created = await User.create({ 
      name, 
      email: email.toLowerCase(), 
      passwordHash,
      mobile: mobile?.trim() || undefined,
      address: address?.trim() || undefined,
    });

    res.status(201).json({
      ok: true,
      user: {
        id: created._id,
        name: created.name,
        email: created.email,
        mobile: created.mobile || null,
        address: created.address || null,
      },
    });
  } catch (err) {
    console.error('Signup error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    res.json({
      ok: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile || null,
        address: user.address || null,
      },
    });
  } catch (err) {
    console.error('Login error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// User profile + applications
app.get('/api/users/:id/applications', async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const applications = await Application.find({ user: userId })
      .populate('animal')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      ok: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile || null,
        address: user.address || null,
      },
      applications: applications.map((a) => ({
        id: a._id,
        createdAt: a.createdAt,
        message: a.message,
        animal: a.animal
          ? {
              id: a.animal._id,
              name: a.animal.name,
              type: a.animal.type,
              breed: a.animal.breed,
            }
          : null,
      })),
    });
  } catch (err) {
    console.error('Profile/applications error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user profile
app.put('/api/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const { name, mobile, address } = req.body;

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ error: 'Name is required and must be at least 2 characters' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update fields
    user.name = name.trim();
    if (mobile !== undefined) {
      user.mobile = mobile?.trim() || undefined;
    }
    if (address !== undefined) {
      user.address = address?.trim() || undefined;
    }

    await user.save();

    res.json({
      ok: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        mobile: user.mobile || null,
        address: user.address || null,
      },
    });
  } catch (err) {
    console.error('Update profile error', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Static files (after API routes)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname,'public')));

// Fallback to index (SPA-friendly)
app.get('*', (req,res) => {
  res.sendFile(path.join(__dirname,'public','index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log('Server listening on', PORT));
