// routes/internalMarks.js
import express from 'express';
import Marks from '../models/Marks.js';
import Student from '../models/Student.js';
import Lecturer from '../models/Lecturer.js';
import Subject from '../models/Subject.js';

const router = express.Router();

// ✅ POST /api/internals/update
router.post('/update', async (req, res) => {
  const { lecturerEmail, subjectId, marks } = req.body;

  try {
    const lecturer = await Lecturer.findOne({ email: lecturerEmail });

    if (!lecturer) {
      return res.status(404).json({ message: '❌ Lecturer not found' });
    }

    // ✅ Fix ObjectId vs String comparison
    const lecturerSubjectIds = lecturer.subjects.map(id => id.toString());
    if (!lecturerSubjectIds.includes(subjectId)) {
      return res.status(403).json({ message: '❌ You are not authorized to update this subject' });
    }

    for (const { studentId, internalMarks } of marks) {
      await Marks.findOneAndUpdate(
        { student: studentId, subject: subjectId },
        { $set: { internalMarks } },
        { upsert: true, new: true }
      );
    }

    res.status(200).json({ message: '✅ Internal marks updated successfully' });
  } catch (err) {
    console.error('❌ Error updating marks:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/internal-marks/:subjectId
router.get('/:subjectId', async (req, res) => {
  const { subjectId } = req.params;

  try {
    const marks = await Marks.find({ subject: subjectId });
    res.status(200).json(marks);
  } catch (err) {
    console.error('❌ Error fetching marks:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});
// GET /api/internal-marks/student/:studentId
router.get('/student/:studentId', async (req, res) => {
  try {
    const studentId = req.params.studentId;
    const marks = await Marks.find({ student: studentId });
    res.status(200).json(marks);
  } catch (err) {
    console.error('❌ Error fetching student marks:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});


export default router;
