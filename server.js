import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import resetRoutes from './routes/reset.js';
import userAuthRoutes from './routes/UserAuth.js';
import studentRoutes from './routes/studentRegister.js';
import lecturerRoutes from './routes/lecturerRegister.js';
import subjectRoutes from './routes/addSubject.js';
import timetableRoutes from './routes/generateTimetable.js'; // ✅ rename for clarity
import assignSubjectsRoute from './routes/assignSubjects.js';
import arrangeInternalsRoute from './routes/arrangeInternals.js';
import internalMarksRoute from './routes/internalMarks.js';
import resultRoutes from './routes/results.js';
import lecturerLeaveRoutes from './routes/lecturerLeave.js';
import examTimetableRoutes from './routes/examTimetable.js';
import hallTicketRoutes from './routes/hallTicket.js';
import uploadNotesRoutes from './routes/uploadNotes.js';
import lecturerAttendanceRoutes from './routes/lecturerAttendance.js';
import studentAttendanceRoutes from './routes/studentAttendance.js';
import leaveRoutes from './routes/leaveLetters.js';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.send('Welcome to Eshala API');
});

app.use('/api/users', userAuthRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/lecturer', lecturerRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/timetable', timetableRoutes); // ✅ this now matches frontend
app.use('/api/assign-subjects', assignSubjectsRoute);
app.use('/api/internals', arrangeInternalsRoute);
app.use('/api/internal-marks', internalMarksRoute); // ✅ for backward compatibility
app.use('/api/results', resultRoutes); 
app.use('/api/lecturer-attendance', lecturerAttendanceRoutes);
app.use('/api/student-attendance', studentAttendanceRoutes);
app.use('/api/lecturer-leave', lecturerLeaveRoutes);
app.use('/api/exam-timetable', examTimetableRoutes);
app.use('/api/hall-ticket', hallTicketRoutes);
app.use('/api/notes', uploadNotesRoutes);
app.use('/uploads', express.static('uploads'));
app.use('/api/leave', leaveRoutes);
app.use('/api/reset', resetRoutes);
// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    app.listen(PORT, () =>
      console.log(`🚀 Server running on http://localhost:${PORT}`)
    );
  })
  .catch((error) => {
    console.error('❌ MongoDB connection failed:', error.message);
  });
