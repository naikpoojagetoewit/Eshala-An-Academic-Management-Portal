import mongoose from 'mongoose';

const hallTicketSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  sem: { type: Number, required: true },
  examCenter: { type: String, required: true },
  timetable: [
    {
      subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
      date: Date,
      session: String,
    }
  ]
}, { timestamps: true });

export default mongoose.model('HallTicket', hallTicketSchema);
