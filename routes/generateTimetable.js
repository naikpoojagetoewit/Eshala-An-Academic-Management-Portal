import express from 'express';
import Timetable from '../models/Timetable.js';
import Subject from '../models/Subject.js';

const router = express.Router();

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const PERIODS_PER_DAY = 6;
const PERIOD_BLOCKS = [
  [0, 1, 2],
  [2, 3, 4],
  [3, 4, 5],
];

// Helpers
const isLecturerBusy = (entries, day, period, lecturerId) => {
  return entries.some(
    (e) => e.day === day && e.periodIndex === period && String(e.lecturer) === String(lecturerId)
  );
};

const isSlotFilled = (entries, day, period) => {
  return entries.some((e) => e.day === day && e.periodIndex === period);
};

const hasConsecutiveSameSubject = (entries, day, period, subjectId) => {
  return entries.some(
    (e) =>
      e.day === day &&
      (e.periodIndex === period - 1 || e.periodIndex === period + 1) &&
      String(e.subject) === String(subjectId)
  );
};

const isSubjectPlacedThatDay = (entries, day, subjectId) => {
  return entries.some(
    (e) => e.day === day && String(e.subject) === String(subjectId)
  );
};

const shuffleArray = (array) => {
  return [...array].sort(() => Math.random() - 0.5);
};

// POST /api/timetable - Generate or update timetable
router.post('/', async (req, res) => {
  const { semester, assignments } = req.body;

  if (!semester || !assignments || typeof assignments !== 'object') {
    return res.status(400).json({ message: 'Semester and assignments required' });
  }

  try {
    const subjects = await Subject.find({ sem: semester });

    let finalEntries = [];
    const maxRetries = 10;
    let retryCount = 0;

    while (retryCount < maxRetries) {
      const entries = [];
      const shuffledSubjects = shuffleArray(subjects);
      let success = true;

      for (const subject of shuffledSubjects) {
        const lecturerId = assignments[subject._id];
        if (!lecturerId) continue;

        const requiredCount = subject.isLab ? 1 : 4;
        let placed = 0;
        let attempts = 0;

        while (placed < requiredCount && attempts < 10) {
          const shuffledDays = shuffleArray(DAYS);

          for (const day of shuffledDays) {
            if (placed >= requiredCount) break;

            if (subject.isLab) {
              for (const [p1, p2, p3] of PERIOD_BLOCKS) {
                const canPlace =
                  !isSlotFilled(entries, day, p1) &&
                  !isSlotFilled(entries, day, p2) &&
                  !isSlotFilled(entries, day, p3) &&
                  !isLecturerBusy(entries, day, p1, lecturerId) &&
                  !isLecturerBusy(entries, day, p2, lecturerId) &&
                  !isLecturerBusy(entries, day, p3, lecturerId);

                if (canPlace) {
                  entries.push(
                    { day, periodIndex: p1, subject: subject._id, lecturer: lecturerId },
                    { day, periodIndex: p2, subject: subject._id, lecturer: lecturerId },
                    { day, periodIndex: p3, subject: subject._id, lecturer: lecturerId }
                  );
                  placed++;
                  break;
                }
              }
            } else {
              if (isSubjectPlacedThatDay(entries, day, subject._id)) continue;

              for (let p = 0; p < PERIODS_PER_DAY && placed < requiredCount; p++) {
                const canPlace =
                  !isSlotFilled(entries, day, p) &&
                  !isLecturerBusy(entries, day, p, lecturerId) &&
                  !hasConsecutiveSameSubject(entries, day, p, subject._id);

                if (canPlace) {
                  entries.push({
                    day,
                    periodIndex: p,
                    subject: subject._id,
                    lecturer: lecturerId,
                  });
                  placed++;
                  break;
                }
              }
            }
          }

          attempts++;
        }

        if (placed < requiredCount) {
          console.warn(`⚠️ Subject "${subject.name}" placed only ${placed}/${requiredCount} times`);
          success = false;
          break;
        }
      }

      if (success) {
        finalEntries = entries;
        break;
      }

      retryCount++;
    }

    if (!finalEntries.length) {
      return res.status(500).json({
        message: '❌ Failed to generate timetable after multiple attempts.',
      });
    }

    const updated = await Timetable.findOneAndUpdate(
      { sem: semester },
      { entries: finalEntries, sem: semester },
      { upsert: true, new: true }
    );

    res.status(201).json({
      message: '✅ Timetable generated or updated successfully!',
      timetable: updated,
    });
  } catch (err) {
    console.error('❌ Timetable generation failed:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/timetable/:sem - Get timetable by semester
router.get('/:sem', async (req, res) => {
  try {
    const sem = Number(req.params.sem);
    const timetable = await Timetable.findOne({ sem })
      .populate({ path: 'entries.subject', select: 'name code' })
      .populate({ path: 'entries.lecturer', select: 'name email' });

    if (!timetable) {
      return res.status(404).json({ message: 'No timetable found for this semester' });
    }

    res.status(200).json(timetable);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch timetable', error: err.message });
  }
});

// GET /api/timetable/lecturer/:lecturerId/today - Get today's classes for a lecturer
router.get('/lecturer/:lecturerId/today', async (req, res) => {
  const { lecturerId } = req.params;

  try {
    const today = new Date().toLocaleString('en-US', { weekday: 'long' });

    // Find all timetables where this lecturer has entries
    const timetables = await Timetable.find({ 'entries.lecturer': lecturerId });

    const todayEntries = [];

    for (const timetable of timetables) {
      const entries = timetable.entries.filter(
        (e) => e.day === today && String(e.lecturer) === String(lecturerId)
      );

      for (const entry of entries) {
        const subject = await Subject.findById(entry.subject).select('name code sem');

        if (subject) {
          todayEntries.push({
            sem: timetable.sem,
            day: entry.day,
            period: entry.periodIndex + 1,
            subjectId: subject._id,
            subjectName: subject.name,
            subjectCode: subject.code,
          });
        }
      }
    }

    if (!todayEntries.length) {
      return res.status(200).json({ message: 'No classes scheduled for today.', classes: [] });
    }

    res.status(200).json({ message: 'Today\'s classes fetched successfully.', classes: todayEntries });
  } catch (err) {
    console.error('❌ Error fetching today\'s timetable for lecturer:', err.message);
    res.status(500).json({ message: 'Failed to fetch timetable', error: err.message });
  }
});

export default router;
