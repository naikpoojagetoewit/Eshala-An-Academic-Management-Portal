import express from 'express';
import InternalExam from '../models/InternalExam.js';
import Subject from '../models/Subject.js';

const router = express.Router();

// ✅ POST /api/internals => Generate internal exam schedule
router.post('/', async (req, res) => {
  const { sem, startDate } = req.body;

  if (!sem || !startDate) {
    return res.status(400).json({ message: 'Semester and start date are required' });
  }

  try {
    // ✅ Prevent duplicates
    const exists = await InternalExam.findOne({ sem });
    if (exists) {
      return res.status(409).json({ message: `❌ Internal exam already arranged for Semester ${sem}` });
    }

    const subjects = await Subject.find({ sem });
    if (subjects.length === 0) {
      return res.status(404).json({ message: 'No subjects found for this semester' });
    }

    const schedule = [];
    let date = new Date(startDate);

    for (let i = 0; i < subjects.length; i += 2) {
      const daySchedule = {
        date: date.toISOString().split('T')[0],
        subjects: [],
      };

      if (subjects[i]) {
        daySchedule.subjects.push({
          time: '9:30–11:00 AM',
          subject: subjects[i].name,
        });
      }

      if (subjects[i + 1]) {
        daySchedule.subjects.push({
          time: '2:00–3:30 PM',
          subject: subjects[i + 1].name,
        });
      }

      schedule.push(daySchedule);
      date.setDate(date.getDate() + 1);
    }

    const internalExam = await InternalExam.create({
      sem,
      startDate,
      schedule,
    });

    res.status(201).json({ message: '✅ Internal exam schedule generated', internalExam });
  } catch (err) {
    res.status(500).json({ message: '❌ Failed to generate schedule', error: err.message });
  }
});

// ✅ GET /api/internals => Fetch all internal exam schedules
router.get('/', async (req, res) => {
  try {
    const internals = await InternalExam.find().sort({ sem: 1 });
    res.status(200).json({ internals });
  } catch (err) {
    res.status(500).json({ message: '❌ Failed to fetch internal exams', error: err.message });
  }
});

// ✅ GET /api/internals/:sem => Fetch schedule for specific semester
router.get('/:sem', async (req, res) => {
  const { sem } = req.params;

  try {
    const exam = await InternalExam.findOne({ sem });
    if (!exam) {
      return res.status(404).json({ message: `No schedule found for semester ${sem}` });
    }
    res.status(200).json(exam);
  } catch (err) {
    res.status(500).json({ message: '❌ Failed to fetch internal exam', error: err.message });
  }
});

// GET /api/internals/:sem => Get internal exam for a semester
router.get('/:sem', async (req, res) => {
  try {
    const internal = await InternalExam.findOne({ sem: req.params.sem });
    if (!internal) {
      return res.status(404).json({ message: 'Internal exam not found' });
    }
    res.status(200).json({ internalExam: internal });
  } catch (err) {
    res.status(500).json({ message: '❌ Failed to fetch', error: err.message });
  }
});

// PUT /api/internals/:sem => Update internal exam startDate + regenerate
router.put('/:sem', async (req, res) => {
  const { startDate } = req.body;
  if (!startDate) {
    return res.status(400).json({ message: 'Start date is required' });
  }

  try {
    const existing = await InternalExam.findOne({ sem: req.params.sem });
    if (!existing) return res.status(404).json({ message: 'Internal exam not found' });

    const subjects = await Subject.find({ sem: req.params.sem });
    if (subjects.length === 0) {
      return res.status(404).json({ message: 'No subjects found for this semester' });
    }

    const schedule = [];
    let date = new Date(startDate);

    for (let i = 0; i < subjects.length; i += 2) {
      const daySchedule = {
        date: date.toISOString().split('T')[0],
        subjects: [],
      };
      if (subjects[i]) daySchedule.subjects.push({ time: '9:30–11:00 AM', subject: subjects[i].name });
      if (subjects[i + 1]) daySchedule.subjects.push({ time: '2:00–3:30 PM', subject: subjects[i + 1].name });
      schedule.push(daySchedule);
      date.setDate(date.getDate() + 1);
    }

    existing.startDate = startDate;
    existing.schedule = schedule;
    await existing.save();

    res.status(200).json({ message: '✅ Internal exam updated', internalExam: existing });
  } catch (err) {
    res.status(500).json({ message: '❌ Update failed', error: err.message });
  }
});

// DELETE /api/internals/:sem => Delete internal exam for a semester
router.delete('/:sem', async (req, res) => {
  try {
    const deleted = await InternalExam.findOneAndDelete({ sem: req.params.sem });
    if (!deleted) return res.status(404).json({ message: 'No internal exam found for deletion' });
    res.status(200).json({ message: '🗑️ Internal exam deleted' });
  } catch (err) {
    res.status(500).json({ message: '❌ Delete failed', error: err.message });
  }
});


export default router;
