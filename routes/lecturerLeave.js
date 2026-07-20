import express from 'express';
import LecturerLeave from '../models/LecturerLeave.js';

const router = express.Router();

// ✅ Apply for leave
router.post('/apply', async (req, res) => {
  const { lecturerId, fromDate, toDate, reason } = req.body;

  if (!lecturerId || !fromDate || !toDate || !reason) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const leave = new LecturerLeave({ lecturer: lecturerId, fromDate, toDate, reason });
    await leave.save();
    res.status(201).json({ message: 'Leave applied successfully', leave });
  } catch (error) {
    res.status(500).json({ message: 'Error applying leave', error: error.message });
  }
});

// ✅ View own leaves
router.get('/my-leaves/:lecturerId', async (req, res) => {
  try {
    const leaves = await LecturerLeave.find({ lecturer: req.params.lecturerId }).sort({ fromDate: -1 });
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch leave data' });
  }
});

// ✅ Get all leave applications (for HOD)
// ✅ View all leave applications (for HOD)
router.get('/all', async (req, res) => {
  try {
    const leaves = await LecturerLeave.find()
      .populate('lecturer', 'name email') // ✅ make sure 'name' exists on User schema
      .sort({ createdAt: -1 });

    res.json(leaves);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch all leaves', error: err.message });
  }
});


// ✅ Approve or Reject a leave
router.put('/update-status/:leaveId', async (req, res) => {
  const { status } = req.body;
  if (!['Approved', 'Rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status value' });
  }

  try {
    const leave = await LecturerLeave.findByIdAndUpdate(
      req.params.leaveId,
      { status },
      { new: true }
    );
    if (!leave) return res.status(404).json({ message: 'Leave not found' });

    res.json({ message: `Leave ${status.toLowerCase()}`, leave });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update leave status' });
  }
});


export default router;
