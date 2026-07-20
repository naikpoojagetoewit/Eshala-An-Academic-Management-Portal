import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  dob: { type: Date, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  caste: { type: String, required: true },
  religion: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  address: { type: String, required: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
  fatherName: { type: String, required: true },
  motherName: { type: String, required: true },
  previousDegree: { type: String, required: true },
  percentage: { type: Number, required: true },
  yearPassed: { type: Number, required: true },
  sem: { type: Number, default: 1 },
  course: { type: String, default: 'MCA' },
  usn: { type: String, unique: true },
  mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'Lecturer', default: null }
}, {
  timestamps: true,
});

const Student = mongoose.model('Student', studentSchema);
export default Student; // ✅ ESM-compatible export
