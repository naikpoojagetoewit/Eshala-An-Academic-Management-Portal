import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  sem: { type: Number, required: true },
  isLab: { type: Boolean, default: false }
});

export default mongoose.model('Subject', subjectSchema);
