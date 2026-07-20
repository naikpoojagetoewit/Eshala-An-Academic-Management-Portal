import mongoose from 'mongoose';

const lecturerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  experience: { type: String, required: true }, // 'fresher' or '3 years'
  isPhD: { type: Boolean, required: true },
  designation: {
    type: String,
    enum: ['Professor', 'Associate Professor'],
    required: true
  },
  joinedDate: { type: Date, required: true },

  // ✅ Array of student references (mentees)
  mentees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],

  // ✅ New: Array of subject references
  subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }],
}, {
  timestamps: true,
});

const Lecturer = mongoose.model('Lecturer', lecturerSchema);
export default Lecturer;
