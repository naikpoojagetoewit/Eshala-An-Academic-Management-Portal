import express from 'express';
import HallTicket from '../models/HallTicket.js';
import ExamTimetable from '../models/ExamTimetable.js';
import Student from '../models/Student.js';

const router = express.Router();

// POST /api/hall-ticket/generate
router.post('/generate', async (req, res) => {
  const { studentIds, sem, examCenter } = req.body;

  if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0 || !sem || !examCenter) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const timetable = await ExamTimetable.findOne({ sem });
    if (!timetable) {
      return res.status(404).json({ message: 'Timetable not found for this semester' });
    }

    let hallTickets = [];
    let alreadyGenerated = [];

    for (const studentId of studentIds) {
      const exists = await HallTicket.findOne({ student: studentId, sem });
      if (exists) {
        alreadyGenerated.push(studentId);
        continue;
      }

      const newTicket = new HallTicket({
        student: studentId,
        sem,
        examCenter,
        timetable: timetable.schedule
      });

      await newTicket.save();
      hallTickets.push(newTicket);
    }

    res.json({
      message: 'Hall ticket generation complete',
      generatedCount: hallTickets.length,
      alreadyGeneratedCount: alreadyGenerated.length,
      alreadyGeneratedStudents: alreadyGenerated
    });
  } catch (err) {
    console.error('❌ Error generating hall tickets:', err);
    res.status(500).json({ message: 'Error generating hall tickets', error: err.message });
  }
});

// GET /api/hall-ticket/all
router.get('/all', async (req, res) => {
  try {
    const tickets = await HallTicket.find()
      .populate('student')
      .populate('timetable.subject'); // works only if subject is ref
    res.json(tickets);
  } catch (err) {
    console.error('❌ Error fetching hall tickets:', err);
    res.status(500).json({ message: 'Failed to fetch hall tickets', error: err.message });
  }
});

// GET /api/hall-ticket/generated/:sem
router.get('/generated/:sem', async (req, res) => {
  const { sem } = req.params;

  try {
    const tickets = await HallTicket.find({ sem }).populate('student');
    res.json(tickets);
  } catch (err) {
    console.error('❌ Error fetching generated hall tickets:', err);
    res.status(500).json({ message: 'Failed to fetch hall tickets', error: err.message });
  }
});

// GET /api/hall-ticket/student/:studentId
router.get('/student/:studentId', async (req, res) => {
  const { studentId } = req.params;

  try {
    const tickets = await HallTicket.find({ student: studentId })
      .populate('student', 'name usn sem')
      .populate('timetable.subject', 'name code');

    if (!tickets || tickets.length === 0) {
      return res.status(404).json({ message: 'Hall ticket not found' });
    }

    res.json(tickets);
  } catch (err) {
    console.error('❌ Error fetching hall ticket:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

export default router;
