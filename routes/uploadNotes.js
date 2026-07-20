// routes/uploadNotes.js
import express from 'express';
import multer from 'multer';
import Note from '../models/Note.js';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/notes/'),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

// ✅ POST /api/notes/upload
router.post('/upload', upload.single('file'), async (req, res) => {
  const { title, subject, semester, uploadedBy } = req.body;

  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  try {
    const note = new Note({
      title,
      subject,
      semester,
      fileUrl: `/uploads/notes/${req.file.filename}`,
      uploadedBy
    });
    await note.save();
    res.json({ message: '✅ Notes uploaded', note });
  } catch (err) {
    console.error('❌ Upload failed:', err);
    res.status(500).json({ message: 'Upload failed', error: err.message });
  }
});
// GET /api/notes/student/:sem - Get all notes for a semester
router.get('/student/:sem', async (req, res) => {
  try {
    const sem = parseInt(req.params.sem);
    const notes = await Note.find({ semester: sem })
      .populate('subject', 'name code')
      .populate('uploadedBy', 'name email');
    res.status(200).json(notes);
  } catch (err) {
    console.error('❌ Failed to fetch notes:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

export default router;
