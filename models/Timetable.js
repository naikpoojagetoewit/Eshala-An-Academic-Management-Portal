// models/Timetable.js
import mongoose from 'mongoose';

const timetableEntrySchema = new mongoose.Schema({
  day: { type: String, required: true }, // 'Monday', 'Tuesday', etc.
  periodIndex: { type: Number, required: true }, // 0 to 5 for 6 periods/day
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  lecturer: { type: mongoose.Schema.Types.ObjectId, ref: 'Lecturer', required: true },
});

const timetableSchema = new mongoose.Schema({
  sem: { type: Number, required: true, unique: true },
  entries: [timetableEntrySchema],
});

// ✅ Consistent model name and export
export default mongoose.models.Timetable || mongoose.model('Timetable', timetableSchema);
