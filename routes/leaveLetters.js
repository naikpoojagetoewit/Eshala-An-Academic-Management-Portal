import express from 'express';
import LeaveLetter from '../models/LeaveLetter.js';
import Student from '../models/Student.js';

const router = express.Router();

// 🟢 Student applies for leave
router.post('/submit', async (req, res) => {
  const { studentId, reason, fromDate, toDate } = req.body;
  try {
    const leave = new LeaveLetter({ student: studentId, reason, fromDate, toDate });
    await leave.save();
    res.status(201).json({ message: '✅ Leave submitted' });
  } catch (err) {
    res.status(500).json({ message: '❌ Error submitting leave', error: err.message });
  }
});

// 🟠 Lecturer views all leave applications
router.get('/all', async (req, res) => {
  try {
    const leaves = await LeaveLetter.find()
      .populate('student', 'name usn sem')
      .sort({ submittedAt: -1 });
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ message: '❌ Error fetching leaves', error: err.message });
  }
});

// 🟣 Lecturer updates leave status
router.post('/update-status', async (req, res) => {
  const { leaveId, status } = req.body;
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  try {
    await LeaveLetter.findByIdAndUpdate(leaveId, { status });
    res.json({ message: `✅ Leave ${status}` });
  } catch (err) {
    res.status(500).json({ message: '❌ Error updating status', error: err.message });
  }
});

// 🔵 Student views their own leave history
router.get('/student/:studentId', async (req, res) => {
  const { studentId } = req.params;
  try {
    const leaves = await LeaveLetter.find({ student: studentId }).sort({ submittedAt: -1 });
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ message: '❌ Failed to fetch student leave history', error: err.message });
  }
});

export default router;
