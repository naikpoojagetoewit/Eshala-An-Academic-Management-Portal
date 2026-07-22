import express from 'express';
import Lecturer from '../models/Lecturer.js';
import User from '../models/User.js';

import PDFDocument from 'pdfkit';
import bcrypt from 'bcryptjs';
import Subject from '../models/Subject.js'; 
const router = express.Router();

// 🔹 Register Lecturer
router.post('/register', async (req, res) => {
  const {
    name,
    email,
    password,
    experience,
    isPhD,
    designation,
    joinedDate
  } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const fullName = isPhD ? `Dr. ${name}` : name;

    // Save Lecturer
    const newLecturer = new Lecturer({
      name: fullName,
      email,
      experience,
      isPhD,
      designation,
      joinedDate
    });
    await newLecturer.save();

    // Save in users
    const newUser = new User({
      email,
      password: hashedPassword,
      role: 'lecturer'
    });
    await newUser.save();

    // Create PDF
    const doc = new PDFDocument({ margin: 50 });
    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', async () => {
      const pdfData = Buffer.concat(buffers);

      try {
        const emailPayload = {
          sender: { name: 'Eshala', email: 'eshaala.official20@gmail.com' },
          to: [{ email, name: fullName }],
          subject: 'Eshala - Lecturer Login Details',
          htmlContent: `
            <p>Hello ${fullName},</p>
            <p>You have been registered as a lecturer on the Eshala platform.</p>
            <p><strong>Login Email:</strong> ${email}<br/>
            <strong>Password:</strong> ${password}</p>
            <p>Please find your registration details attached as a PDF.</p>
          `,
          attachment: [
            {
              content: pdfData.toString('base64'),
              name: 'lecturer-details.pdf'
            }
          ]
        };

        const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'api-key': process.env.BREVO_API_KEY,
            'content-type': 'application/json'
          },
          body: JSON.stringify(emailPayload)
        });

        if (!brevoResponse.ok) {
          const errorBody = await brevoResponse.text();
          throw new Error(`Brevo API error (${brevoResponse.status}): ${errorBody}`);
        }

        return res.status(201).json({ message: '✅ Lecturer registered and email sent' });
      } catch (emailError) {
        console.error('❌ Email sending failed:', emailError.message);
        return res.status(201).json({ message: 'Lecturer saved, but email failed', error: emailError.message });
      }
    });

    // PDF Content
    doc.fontSize(20).text('Eshala Lecturer Registration Details', { align: 'center', underline: true });
    doc.moveDown(1);
    doc.rect(50, 110, 500, 350).stroke(); // border

    let y = 145;
    const gap = 25;

    const row = (label, value) => {
      doc.font('Helvetica-Bold').text(`${label}:`, 70, y);
      doc.font('Helvetica').text(String(value), 200, y);
      y += gap;
    };

    row('Name', fullName);
    row('Email', email);
    row('Designation', designation);
    row('PhD Status', isPhD ? 'Completed' : 'Not Completed');
    row('Experience', experience === 'fresher' ? 'Fresher' : `${experience} years`);
    row('Joined Date', joinedDate);

    doc.moveTo(380, y + 30).lineTo(530, y + 30).stroke();
    doc.fontSize(12).text('Lecturer Signature', 400, y + 35);

    doc.end();

  } catch (error) {
    console.error('❌ Lecturer registration error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


// 🔹 GET /api/lecturer/list - List all lecturers
router.get('/list', async (req, res) => {
  try {
    const lecturers = await Lecturer.find().sort({ joinedDate: -1 });
    res.status(200).json(lecturers);
  } catch (error) {
    console.error('❌ Failed to fetch lecturers:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// 🔹 GET /api/lecturer/available - Lecturers with < 10 mentees
router.get('/available', async (req, res) => {
  try {
    const availableLecturers = await Lecturer.find({ $expr: { $lt: [{ $size: '$mentees' }, 10] } });
    res.status(200).json(availableLecturers);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch available lecturers', error: error.message });
  }
});

// 🔹 GET /api/lecturer/with-mentees - Lecturer + mentees details
router.get('/with-mentees', async (req, res) => {
  try {
    const lecturers = await Lecturer.find()
      .populate({
        path: 'mentees',
        select: 'name usn course sem',
      });

    res.status(200).json(lecturers);
  } catch (err) {
    console.error('❌ Failed to fetch mentors with mentees:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/profile/:email', async (req, res) => {
  const requestedEmail = req.params.email?.trim().toLowerCase();
  console.log('📥 API HIT - GET /profile/:email:', requestedEmail);

  try {
    const lecturer = await Lecturer.findOne({ email: requestedEmail });

    if (!lecturer) {
      console.log('❌ No lecturer found for email:', requestedEmail);
      return res.status(404).json({ message: 'Lecturer not found' });
    }

    console.log('✅ Lecturer found:', lecturer.email);
    res.status(200).json(lecturer);
  } catch (err) {
    console.error('❌ Error fetching lecturer profile:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// 🔹 GET /api/lecturer/subjects/:lecturerId - Get subjects assigned to a lecturer
router.get('/subjects/:lecturerId', async (req, res) => {
  const { lecturerId } = req.params;

  try {
    const lecturer = await Lecturer.findById(lecturerId);
    if (!lecturer) {
      return res.status(404).json({ message: 'Lecturer not found' });
    }

    const subjects = await Subject.find({
      _id: { $in: lecturer.subjects }
    });

    res.json(subjects);
  } catch (err) {
    console.error('❌ Error fetching subjects for lecturer:', err.message);
    res.status(500).json({ message: 'Error fetching subjects', error: err.message });
  }
});


export default router;