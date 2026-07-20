// server/routes/assignSubjects.js
import express from 'express';
import Lecturer from '../models/Lecturer.js';
import Subject from '../models/Subject.js';

const router = express.Router();

// Route: POST /api/assign-subjects
router.post('/', async (req, res) => {
  const { semester, assignments } = req.body;

  try {
    for (const [subjectId, lecturerId] of Object.entries(assignments)) {
      // Add subject to lecturer
      await Lecturer.findByIdAndUpdate(lecturerId, {
        $addToSet: { subjects: subjectId }
      });
    }

    res.status(200).json({ message: '✅ Assignments saved successfully!' });
  } catch (err) {
    console.error('❌ Failed to assign subjects:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

export default router;
