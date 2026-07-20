// models/Marks.js
import mongoose from 'mongoose';

const marksSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  internalMarks: { type: Number, default: 0 },
  externalMarks: { type: Number, default: null }, // HOD will update this
}, {
  timestamps: true,
  unique: true,
});

marksSchema.index({ student: 1, subject: 1 }, { unique: true }); // avoid duplicates

export default mongoose.model('Marks', marksSchema);
