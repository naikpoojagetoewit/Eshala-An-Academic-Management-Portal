import express from 'express';
import ExamTimetable from '../models/ExamTimetable.js';

const router = express.Router();

/**
 * @route   POST /api/exam-timetable/generate
 * @desc    Create or update exam timetable for a semester
 * @access  Public / Admin
 */
router.post('/generate', async (req, res) => {
  const { sem, schedule } = req.body;

  try {
    if (!sem || !Array.isArray(schedule) || schedule.length === 0) {
      return res.status(400).json({ message: 'Semester and schedule are required' });
    }

    let existing = await ExamTimetable.findOne({ sem });

    if (existing) {
      existing.schedule = schedule;
      await existing.save();
      return res.json({ message: '✅ Timetable updated', timetable: existing });
    }

    const newTimetable = new ExamTimetable({ sem, schedule });
    await newTimetable.save();

    res.status(201).json({ message: '✅ Timetable created', timetable: newTimetable });
  } catch (err) {
    console.error('❌ Error in timetable generation:', err);
    res.status(500).json({ message: 'Error generating timetable', error: err.message });
  }
});

/**
 * @route   GET /api/exam-timetable/:sem
 * @desc    Fetch exam timetable by semester
 * @access  Public / HOD
 */
router.get('/:sem', async (req, res) => {
  try {
    const timetable = await ExamTimetable.findOne({ sem: req.params.sem }).populate('schedule.subject');

    if (!timetable) {
      return res.status(404).json({ message: 'Timetable not found' });
    }

    res.json(timetable);
  } catch (err) {
    console.error('❌ Error fetching timetable:', err);
    res.status(500).json({ message: 'Failed to fetch timetable', error: err.message });
  }
});

/**
 * @route   GET /api/exam-timetable
 * @desc    Fetch all exam timetables (for admin/HOD overview)
 * @access  Public / Admin
 */
router.get('/', async (req, res) => {
  try {
    const timetables = await ExamTimetable.find().populate('schedule.subject');
    res.json(timetables);
  } catch (err) {
    console.error('❌ Error fetching all timetables:', err);
    res.status(500).json({ message: 'Failed to fetch timetables', error: err.message });
  }
});

export default router;
