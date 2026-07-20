import express from 'express';
import mongoose from 'mongoose';
import Student from '../models/Student.js';
import Lecturer from '../models/Lecturer.js';
import User from '../models/User.js';
import nodemailer from 'nodemailer';
import PDFDocument from 'pdfkit';
import bcrypt from 'bcryptjs';


const router = express.Router();

// 🟢 REGISTER STUDENT
router.post('/register', async (req, res) => {
  const {
    name, dob, email, password, caste, religion, phoneNumber,
    address, gender, fatherName, motherName, previousDegree,
    percentage, yearPassed, mentorId // 🔁 New field from frontend
  } = req.body;

  const course = 'MCA';
  const sem = 1;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    // Validate mentor availability
    let assignedMentor = null;
    if (mentorId) {
      const mentor = await Lecturer.findById(mentorId);
      if (!mentor) return res.status(404).json({ message: 'Mentor not found' });

      if (mentor.mentees.length >= 10) {
        return res.status(400).json({ message: 'Mentor already has 10 mentees' });
      }

      assignedMentor = mentor;
    }
    // Generate USN in format: 1EW25MC001
const prefix = '1EW25MC';
const count = await Student.countDocuments() + 1;
const paddedCount = String(count).padStart(3, '0');
const usn = `${prefix}${paddedCount}`;

    const hashedPassword = await bcrypt.hash(password, 10);

    const newStudent = new Student({
      name,
      dob,
      email,
      password: hashedPassword,
      caste,
      religion,
      phoneNumber,
      address,
      gender,
      fatherName,
      motherName,
      previousDegree,
      percentage,
      yearPassed,
      course,
      sem,
      usn,
      mentor: mentorId || null
    });
    await newStudent.save();

    // Add student to mentor's mentees
    if (assignedMentor) {
      assignedMentor.mentees.push(newStudent._id);
      await assignedMentor.save();
    }

    const newUser = new User({
      email,
      password: hashedPassword,
      role: 'student'
    });
    await newUser.save();

    // 📄 Generate PDF
    const doc = new PDFDocument({ margin: 50 });
    const buffers = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', async () => {
      const pdfData = Buffer.concat(buffers);

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASS
        }
      });

      try {
        await transporter.sendMail({
          from: process.env.MAIL_USER,
          to: email,
          subject: 'Eshala - Student Login Details',
          text: `Hello ${name},

You have been successfully registered as a student.

Login Email: ${email}
Password: ${password}

Course: ${course}
Semester: ${sem}

Please find your registration details attached as a PDF.`,

          attachments: [
            {
              filename: 'student-details.pdf',
              content: pdfData
            }
          ]
        });

        return res.status(201).json({ message: '✅ Student registered and email sent' });

      } catch (emailError) {
        console.error('❌ Email sending failed:', emailError.message);
        return res.status(500).json({ message: 'Student saved, but email failed', error: emailError.message });
      }
    });

    // 📝 PDF Content
    doc.fontSize(20).text('Eshala Student Registration Details', { align: 'center', underline: true });
    doc.moveDown(1);
    doc.rect(50, 110, 500, 580).stroke();

    let y = 145;
    const gap = 20;

    const row = (label, value) => {
      doc.font('Helvetica-Bold').text(`${label}:`, 70, y);
      doc.font('Helvetica').text(String(value), 200, y);
      y += gap;
    };

    doc.fontSize(14).text('Personal Information', 60, y, { underline: true });
    y += 25;

    row('Name', name);
    row('Date of Birth', dob);
    row('Email', email);
    row('Phone Number', phoneNumber);
    row('Address', address);
    row('Gender', gender);
    row("Father's Name", fatherName);
    row("Mother's Name", motherName);

    doc.fontSize(14).text('Academic Information', 60, y + 5, { underline: true });
    y += 30;
    row('Course', course);
    row('Semester', sem);
    row('Previous Degree', previousDegree);
    row('Percentage', `${percentage}%`);
    row('Year Passed', yearPassed);

    doc.fontSize(14).text('Other Details', 60, y + 5, { underline: true });
    y += 30;
    row('Caste', caste);
    row('Religion', religion);

    if (assignedMentor) {
      row('Mentor', assignedMentor.name);
    }

    doc.moveTo(380, y + 30).lineTo(530, y + 30).stroke();
    doc.fontSize(12).text('Student Signature', 400, y + 35);

    doc.end();

  } catch (error) {
    console.error('❌ Registration error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// 🟢 GET STUDENTS LIST
router.get('/list', async (req, res) => {
  try {
    const students = await Student.find().populate('mentor', 'name email');
    res.status(200).json(students);
  } catch (error) {
    console.error('❌ Failed to fetch students:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// 🟡 ASSIGN MENTOR TO STUDENT
router.post('/assign-mentor', async (req, res) => {
  const { studentId, mentorId } = req.body;

  try {
    const student = await Student.findById(studentId);
    const mentor = await Lecturer.findById(mentorId);

    if (!student || !mentor) {
      return res.status(404).json({ message: 'Student or Mentor not found' });
    }

    if (student.mentor) {
      return res.status(400).json({ message: 'Student already has a mentor' });
    }

    if (mentor.mentees.length >= 10) {
      return res.status(400).json({ message: 'Mentor already has 10 mentees' });
    }

    student.mentor = mentor._id;
    await student.save();

    mentor.mentees.push(student._id);
    await mentor.save();

    res.status(200).json({ message: '✅ Mentor assigned successfully' });

  } catch (error) {
    console.error('❌ Assign mentor error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// 🔹 Get students who have no mentor assigned
router.get('/unassigned', async (req, res) => {
  try {
    const unassigned = await Student.find({ mentor: null }); // ✅ changed
    res.status(200).json(unassigned);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch unassigned students', error: error.message });
  }
});
// ✅ GET /api/students/by-sem/:sem => fetch students by semester
router.get('/by-sem/:sem', async (req, res) => {
  try {
    const sem = parseInt(req.params.sem);
    const students = await Student.find({ sem });
    res.status(200).json(students);
  } catch (error) {
    console.error('❌ Failed to fetch students by sem:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
// ✅ Get all students (base route)
router.get('/', async (req, res) => {
  try {
    const students = await Student.find().populate('mentor', 'name email');
    res.status(200).json(students);
  } catch (error) {
    console.error('❌ Failed to fetch students:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
// ✅ GET student profile by email with mentor populated
router.get('/profile/:email', async (req, res) => {
  const email = req.params.email.toLowerCase();
  try {
    const student = await Student.findOne({ email }).populate('mentor', 'name email');
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json(student);
  } catch (error) {
    console.error('❌ Failed to fetch student profile:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});



export default router;
