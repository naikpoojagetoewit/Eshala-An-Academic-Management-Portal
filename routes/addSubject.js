// routes/addSubject.js
import express from 'express';
import Subject from '../models/Subject.js';

const router = express.Router();

// ✅ POST /api/subjects/add => Add a subject
router.post('/add', async (req, res) => {
  const { name, code, sem, isLab } = req.body;

  try {
    // Check if subject code already exists
    const existing = await Subject.findOne({ code });
    if (existing) {
      return res.status(409).json({ message: 'Subject with this code already exists' });
    }

    const newSubject = new Subject({
      name,
      code,
      sem,
      isLab: isLab || false,
    });

    await newSubject.save();
    res.status(201).json({ message: '✅ Subject added successfully', subject: newSubject });
  } catch (error) {
    console.error('❌ Failed to add subject:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ✅ GET /api/subjects => Fetch all subjects
router.get('/', async (req, res) => {
  try {
    const subjects = await Subject.find().sort({ sem: 1, name: 1 });
    res.status(200).json(subjects);
  } catch (error) {
    console.error('❌ Failed to fetch subjects:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ✅ GET /api/subjects/by-sem/:sem => Fetch subjects by semester
router.get('/by-sem/:sem', async (req, res) => {
  try {
    const subjects = await Subject.find({ sem: req.params.sem });
    res.status(200).json(subjects);
  } catch (error) {
    console.error('❌ Failed to fetch subjects by sem:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
// ✅ GET /api/subjects/:id => Get subject by ID
router.get('/:id', async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }
    res.status(200).json(subject);
  } catch (error) {
    console.error('❌ Failed to fetch subject by ID:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


export default router;
