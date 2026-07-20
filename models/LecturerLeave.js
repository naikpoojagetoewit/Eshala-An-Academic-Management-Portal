// models/LecturerLeave.js
import mongoose from 'mongoose';

const lecturerLeaveSchema = new mongoose.Schema({
  lecturer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lecturer', // ✅ changed from 'User' to 'Lecturer'
    required: true,
  },
  fromDate: { type: Date, required: true },
  toDate: { type: Date, required: true },
  reason: { type: String, required: true },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending',
  },
}, { timestamps: true });

export default mongoose.model('LecturerLeave', lecturerLeaveSchema);
