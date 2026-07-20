import express from 'express';
import StudentAttendance from '../models/StudentAttendance.js';
import Student from '../models/Student.js';
import Subject from '../models/Subject.js';

const router = express.Router();

// 🔹 POST: Mark attendance for students in a subject (only once per day)
router.post('/mark', async (req, res) => {
  const { subjectId, attendanceList } = req.body;

  if (!subjectId || !Array.isArray(attendanceList)) {
    return res.status(400).json({ message: '❌ Invalid data format' });
  }

  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const endOfDay = new Date(today.setHours(23, 59, 59, 999));

  try {
    const alreadyExists = await StudentAttendance.findOne({
      subject: subjectId,
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    if (alreadyExists) {
      return res.status(409).json({ message: '⚠️ Attendance already submitted for this subject today.' });
    }

    const records = attendanceList.map(({ studentId, status }) => ({
      student: studentId,
      subject: subjectId,
      status: status || 'present',
      date: new Date(),
    }));

    await StudentAttendance.insertMany(records);

    return res.status(201).json({ message: '✅ Attendance marked successfully.' });
  } catch (error) {
    console.error('❌ Error marking attendance:', error.message);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// 🔹 GET: Fetch attendance for a subject on a specific date
router.get('/subject/:subjectId/date/:date', async (req, res) => {
  const { subjectId, date } = req.params;

  try {
    const records = await StudentAttendance.find({
      subject: subjectId,
      date: {
        $gte: new Date(`${date}T00:00:00`),
        $lte: new Date(`${date}T23:59:59`),
      },
    }).populate('student', 'name usn');

    res.status(200).json(records);
  } catch (error) {
    console.error('❌ Failed to fetch attendance by date:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// 🔹 NEW: Fetch ALL attendance records for a subject
router.get('/subject/:subjectId', async (req, res) => {
  const { subjectId } = req.params;

  try {
    const records = await StudentAttendance.find({ subject: subjectId })
      .populate('student', 'name usn')
      .sort({ date: -1 }); // Most recent first

    res.status(200).json(records);
  } catch (error) {
    console.error('❌ Failed to fetch full history:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// 🔹 GET: Attendance history for a student in a subject
router.get('/student/:studentId/subject/:subjectId', async (req, res) => {
  const { studentId, subjectId } = req.params;

  try {
    const records = await StudentAttendance.find({
      student: studentId,
      subject: subjectId,
    }).sort({ date: 1 });

    res.status(200).json(records);
  } catch (error) {
    console.error('❌ Failed to fetch student attendance:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// 🔹 GET: Check if today's attendance is already marked for a subject
router.get('/check/:subjectId', async (req, res) => {
  const { subjectId } = req.params;

  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const endOfDay = new Date(today.setHours(23, 59, 59, 999));

  try {
    const existing = await StudentAttendance.findOne({
      subject: subjectId,
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    return res.status(200).json({ alreadyMarked: !!existing });
  } catch (err) {
    console.error('❌ Error checking attendance status:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});


// GET /api/student-attendance/all
router.get('/all', async (req, res) => {
  try {
    const records = await StudentAttendance.find()
      .populate('student', 'name usn sem') // ✅ student fields
      .populate('subject', 'name code sem') // ✅ subject fields
      .sort({ date: -1 });

    res.status(200).json(records);
  } catch (error) {
    console.error('❌ Failed to fetch all attendance:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
// GET /api/student-attendance/percentage/:studentId
router.get('/percentage/:studentId', async (req, res) => {
  const { studentId } = req.params;

  try {
    const allSubjects = await Subject.find(); // to fetch all subjects
    const attendance = await StudentAttendance.find({ student: studentId });

    const result = allSubjects.map(subject => {
      const subjectRecords = attendance.filter(a => String(a.subject) === String(subject._id));
      const total = subjectRecords.length;
      const present = subjectRecords.filter(a => a.status === 'present').length;

      const percentage = total === 0 ? 0 : Math.round((present / total) * 100);

      return {
        subjectName: subject.name,
        subjectCode: subject.code,
        totalClasses: total,
        attended: present,
        percentage
      };
    });

    res.status(200).json(result);
  } catch (error) {
    console.error('❌ Failed to calculate attendance:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


export default router;
