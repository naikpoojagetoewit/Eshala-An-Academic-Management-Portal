// src/pages/StudentRegistration.jsx
import React, { useState } from 'react';
import axios from 'axios';

const StudentRegistration = () => {
  const [formData, setFormData] = useState({
    name: '',
    dob: '',
    email: '',
    password: '',
    caste: '',
    religion: '',
    phoneNumber: '',
    address: '',
    gender: '',
    fatherName: '',
    motherName: '',
    previousDegree: '',
    percentage: '',
    yearPassed: '',
    semester: '', // 👉 ADDED HERE
  });

  const [status, setStatus] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Submitting...');

    try {
      await axios.post('http://localhost:5000/api/student/register', formData);
      setStatus('✅ Student registered successfully. Email sent!');
      setFormData({
        name: '',
        dob: '',
        email: '',
        password: '',
        caste: '',
        religion: '',
        phoneNumber: '',
        address: '',
        gender: '',
        fatherName: '',
        motherName: '',
        previousDegree: '',
        percentage: '',
        yearPassed: '',
        semester: '', // 👉 ADDED HERE
      });
    } catch (error) {
      console.error(error);
      setStatus('❌ Registration failed: ' + (error.response?.data?.message || 'Server error'));
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>📋 Student Registration</h2>
      <form style={styles.form} onSubmit={handleSubmit}>
        {Object.keys(formData).map((field) => (
          <input
            key={field}
            type={field === 'dob' ? 'date' : 'text'}
            name={field}
            placeholder={field
              .replace(/([A-Z])/g, ' $1')
              .replace(/^./, (char) => char.toUpperCase())}
            value={formData[field]}
            onChange={handleChange}
            style={styles.input}
            required
          />
        ))}
        <button type="submit" style={styles.button}>Register Student</button>
      </form>
      {status && <p style={styles.status}>{status}</p>}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '600px',
    margin: '2rem auto',
    padding: '2rem',
    borderRadius: '1rem',
    backgroundColor: '#f9fafb',
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
    fontFamily: 'Segoe UI, sans-serif',
  },
  title: {
    textAlign: 'center',
    marginBottom: '1rem',
    fontSize: '1.5rem',
    color: '#1e40af',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  input: {
    padding: '0.75rem',
    border: '1px solid #d1d5db',
    borderRadius: '0.5rem',
    fontSize: '1rem',
  },
  button: {
    padding: '0.75rem',
    backgroundColor: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: '0.5rem',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  status: {
    marginTop: '1rem',
    textAlign: 'center',
    color: '#374151',
  },
};

export default StudentRegistration;
