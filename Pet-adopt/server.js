// server.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const multer  = require('multer');
const cors = require('cors');
const fs = require('fs');

const Animal = require('./models/Animal');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended:true }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname,'public')));

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

// Create animal (admin) — supports image upload
app.post('/api/admin/animals', upload.single('photo'), async (req,res) => {
  const secret = req.headers['x-admin-secret'] || req.body.adminSecret;
  if(secret !== process.env.ADMIN_SECRET) return res.status(401).json({ error:'unauthorized' });

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
  if(secret !== process.env.ADMIN_SECRET) return res.status(401).json({ error:'unauthorized' });

  const update = { ...req.body };
  if(req.file) update.photo = `/uploads/${req.file.filename}`;
  const updated = await Animal.findByIdAndUpdate(req.params.id, update, { new:true });
  res.json(updated);
});

// Mark adopted
app.post('/api/admin/animals/:id/adopt', async (req,res) => {
  const secret = req.headers['x-admin-secret'] || req.body.adminSecret;
  if(secret !== process.env.ADMIN_SECRET) return res.status(401).json({ error:'unauthorized' });

  const updated = await Animal.findByIdAndUpdate(req.params.id, { adopted:true }, { new:true });
  res.json(updated);
});

// Application form submission (visitor)
app.post('/api/apply', async (req,res) => {
  try {
    const { animalId, name, email, message } = req.body;
    if(!animalId || !name || !email) return res.status(400).json({ error:'missing fields' });
    // Production: persist application or send email. Demo: console log.
    console.log('Adoption application', { animalId, name, email, message });
    res.json({ ok:true, message:'Application received' });
  } catch(err){
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

// Fallback to index (SPA-friendly)
app.get('*', (req,res) => {
  res.sendFile(path.join(__dirname,'public','index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log('Server listening on', PORT));
