import express from 'express';
import mongoose from 'mongoose';
import LecturerAttendance from '../models/LecturerAttendance.js';

const router = express.Router();

// ✅ POST /api/lecturer-attendance/mark
router.post('/mark', async (req, res) => {
  const { lecturerId } = req.body;
  const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD

  if (!lecturerId || lecturerId === 'null' || !mongoose.Types.ObjectId.isValid(lecturerId)) {
    return res.status(400).json({ message: '❌ Invalid lecturer ID' });
  }

  try {
    const existing = await LecturerAttendance.findOne({ lecturer: lecturerId, date: today });

    if (existing) {
      return res.status(400).json({ message: '⚠️ Attendance already marked for today.' });
    }

    const attendance = new LecturerAttendance({
      lecturer: new mongoose.Types.ObjectId(lecturerId),
      date: today,
    });

    await attendance.save();
    res.status(201).json({ message: '✅ Attendance marked successfully' });
  } catch (err) {
    console.error('❌ Error marking attendance:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ✅ GET /api/lecturer-attendance/status/:lecturerId
router.get('/status/:lecturerId', async (req, res) => {
  const { lecturerId } = req.params;
  const today = new Date().toISOString().split('T')[0];

  if (!lecturerId || lecturerId === 'null' || !mongoose.Types.ObjectId.isValid(lecturerId)) {
    return res.status(400).json({ message: '❌ Invalid lecturer ID' });
  }

  try {
    const found = await LecturerAttendance.findOne({ lecturer: lecturerId, date: today });
    res.json({ marked: !!found });
  } catch (err) {
    console.error('❌ Error checking attendance status:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ✅ GET /api/lecturer-attendance/all (for HOD to view all)
router.get('/all', async (req, res) => {
  try {
    const attendance = await LecturerAttendance.find()
      .populate('lecturer', 'name email designation') // Pull limited lecturer info
      .sort({ date: -1 });

    res.json(attendance);
  } catch (err) {
    console.error('❌ Error fetching attendance records:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});
// GET /api/lecturer-attendance/history/:lecturerId
router.get('/history/:lecturerId', async (req, res) => {
  const { lecturerId } = req.params;

  try {
    const records = await LecturerAttendance.find({ lecturer: lecturerId });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch history' });
  }
});

export default router;
