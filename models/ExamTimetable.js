import mongoose from 'mongoose';

const examScheduleSchema = new mongoose.Schema({
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  session: {
    type: String,
    enum: ['morning', 'afternoon'], // ✅ match frontend exactly (case-sensitive)
    required: true,
  },
});

const examTimetableSchema = new mongoose.Schema({
  sem: {
    type: Number,
    required: true,
    unique: true, // ✅ only one timetable per semester
  },
  schedule: {
    type: [examScheduleSchema],
    required: true,
  },
}, { timestamps: true });

export default mongoose.model('ExamTimetable', examTimetableSchema);
