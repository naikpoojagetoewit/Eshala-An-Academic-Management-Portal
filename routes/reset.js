import express from 'express';
import User from '../models/User.js';
import Otp from '../models/Otp.js';
import nodemailer from 'nodemailer';
import otpGenerator from 'otp-generator';
import bcrypt from 'bcrypt';

const router = express.Router();

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'eshaala.official20@gmail.com',      // 🔁 Replace
    pass: 'hsfz lgyh zbwp gels',    // 🔁 App password, not Gmail password
  },
});

// ✅ Send OTP
router.post('/send-otp', async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) return res.status(404).json({ message: 'User not found' });

  const otp = otpGenerator.generate(6, { digits: true, upperCaseAlphabets: false });
  await Otp.create({ email, otp });

  await transporter.sendMail({
    from: 'your_email@gmail.com',
    to: email,
    subject: 'Password Reset OTP',
    html: `<p>Your OTP is <strong>${otp}</strong>. It expires in 5 minutes.</p>`,
  });

  res.json({ message: 'OTP sent to email' });
});

// ✅ Verify OTP
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;

  const record = await Otp.findOne({ email, otp });
  if (!record) return res.status(400).json({ message: 'Invalid or expired OTP' });

  res.json({ message: 'OTP verified' });
});

// ✅ Reset Password
router.post('/reset-password', async (req, res) => {
  const { email, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);

  const updated = await User.findOneAndUpdate({ email }, { password: hashed });
  if (!updated) return res.status(404).json({ message: 'User not found' });

  await Otp.deleteMany({ email }); // Clean up OTPs

  res.json({ message: 'Password reset successful' });
});

export default router;
