import express from 'express';
import bcrypt from 'bcrypt';
import User from '../models/User.js';
import Lecturer from '../models/Lecturer.js';
import Student from '../models/Student.js';

const router = express.Router();

router.post('/login', async (req, res) => {
  const { email, password, role } = req.body;

  try {
    const user = await User.findOne({ email, role });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let isMatch = false;

    if (user.password.startsWith('$2b$')) {
      isMatch = await bcrypt.compare(password, user.password);
    } else {
      isMatch = password === user.password;
    }

    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect password' });
    }

    let name = '';
    let lecturerId = null;

    if (role === 'lecturer') {
      const lecturer = await Lecturer.findOne({ email });
      name = lecturer?.name || '';
      lecturerId = lecturer?._id || null; // ✅ store real lecturer _id
    } else if (role === 'student') {
      const student = await Student.findOne({ email });
      name = student?.name || '';
    } else if (role === 'hod') {
      name = 'HOD';
    }

    res.status(200).json({
      message: `${role} login successful`,
      user: {
        id: user._id,        // 🔹 User._id (for auth/session)
        name,
        email: user.email,
        lecturerId,          // ✅ Only set for lecturer role
      },
    });
  } catch (err) {
    console.error('❌ Login error:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

export default router;
