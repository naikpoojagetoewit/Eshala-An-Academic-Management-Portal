import mongoose from 'mongoose';

const internalExamSchema = new mongoose.Schema({
  sem: {
    type: Number,
    required: true,
    unique: true, // ✅ Ensure only one schedule per semester
  },
  startDate: {
    type: String,
    required: true,
  },
  schedule: [
    {
      date: String,
      subjects: [
        {
          subject: String,
          time: String,
        },
      ],
    },
  ],
});

export default mongoose.model('InternalExam', internalExamSchema);
