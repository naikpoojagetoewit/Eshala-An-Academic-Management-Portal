import express from 'express';
import Marks from '../models/Marks.js'; // ✅ Correct model name
import Student from '../models/Student.js';

const router = express.Router();

// 🟢 GET /api/results/:subjectId => fetch marks (internal + external) for a subject
router.get('/:subjectId', async (req, res) => {
  try {
    const subjectId = req.params.subjectId;

    const results = await Marks.find({ subject: subjectId })
      .populate('student', 'name usn');

    if (!results || results.length === 0) {
      return res.status(404).json({ message: 'No results found for this subject' });
    }

    res.status(200).json(results);
  } catch (error) {
    console.error('❌ Failed to fetch marks:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// 🟡 POST /api/results/update-externals => HOD updates external marks
router.post('/update-externals', async (req, res) => {
  const { subjectId, updates } = req.body;

  try {
    for (const { studentId, externalMarks } of updates) {
      await Marks.findOneAndUpdate(
        { subject: subjectId, student: studentId },
        { externalMarks },
        { new: true }
      );
    }

    res.status(200).json({ message: '✅ External marks updated successfully' });
  } catch (error) {
    console.error('❌ Failed to update external marks:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
// 🟢 GET /api/results/student/:studentId => Fetch all subject-wise marks for a student

// GET /api/results/student/:studentId
router.get('/student/:studentId', async (req, res) => {
  try {
    const studentId = req.params.studentId;

    const results = await Marks.find({ student: studentId })
      .populate('subject', 'name code'); // ✅ important for frontend display

    res.status(200).json(results);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch student results' });
  }
});


export default router;
