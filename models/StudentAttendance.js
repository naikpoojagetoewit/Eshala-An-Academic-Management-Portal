import mongoose from 'mongoose';

const studentAttendanceSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  status: {
    type: String,
    enum: ['present', 'absent'],
    default: 'present'
  },
  date: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const StudentAttendance = mongoose.model('StudentAttendance', studentAttendanceSchema);

export default StudentAttendance;
