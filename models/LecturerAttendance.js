// models/LecturerAttendance.js
import mongoose from 'mongoose';

const lecturerAttendanceSchema = new mongoose.Schema({
  lecturer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lecturer',
    required: true,
  },
  date: {
    type: String, // Format: YYYY-MM-DD
    required: true,
  },
});

lecturerAttendanceSchema.index({ lecturer: 1, date: 1 }, { unique: true });

export default mongoose.model('LecturerAttendance', lecturerAttendanceSchema);
