import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';

const AddUserToTest = ({ testId }) => {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    validUntil: '2028-12-31T23:59:59Z', // Default date
    maxAttempts: 3
  });
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await apiService.post(`/vendor/tests/${testId}/users/add`, {
        users: [{
          email: formData.email,
          name: formData.name
        }],
        validUntil: formData.validUntil,
        maxAttempts: formData.maxAttempts
      });

      setMessage(`Success! ${response.summary.added} user(s) added.`);
      // Clear form
      setFormData({
        ...formData,
        email: '',
        name: ''
      });
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="add-user-form">
      <h2>Add User to Test</h2>
      {message && <div className="message">{message}</div>}
      
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email:</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        
        <div>
          <label>Name:</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        
        <div>
          <label>Max Attempts:</label>
          <input
            type="number"
            name="maxAttempts"
            value={formData.maxAttempts}
            onChange={handleChange}
            min="1"
            required
          />
        </div>

        <button type="submit">Add User</button>
      </form>
    </div>
  );
};

export default AddUserToTest;

