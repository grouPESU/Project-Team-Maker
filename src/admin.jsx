import React, { useState } from 'react';
import axios from 'axios';
import adminStyles from "./admin.module.css"

const App = () => {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'error' or 'success'
  
  // Password viewing states
  const [selectedTable, setSelectedTable] = useState('Student');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  
  // Password updating states
  const [updateUserId, setUpdateUserId] = useState('');
  const [updateTable, setUpdateTable] = useState('Student');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessage('Please select a file to upload.');
      setMessageType('error');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://localhost:3000/upload', formData);
      setMessage(response.data.message);
      setMessageType('success');
      setFile(null);
    } catch (error) {
      setMessage(error.response?.data?.message || error.message);
      setMessageType('error');
    }
  };

  const handleReset = async () => {
    try {
      const response = await axios.post('http://localhost:3000/reset');
      setMessage(response.data.message);
      setMessageType('success');
    } catch (error) {
      setMessage(error.response?.data?.message || error.message);
      setMessageType('error');
    }
  };

  const handleViewPassword = async () => {
    try {
      setPassword('');
      const response = await axios.get(`http://localhost:3000/getPassword/${selectedTable}/${userId}`);
      setPassword(response.data.password);
      setMessage('');
      setMessageType('success');
    } catch (error) {
      setPassword('');
      setMessage(error.response?.data?.message || error.message);
      setMessageType('error');
    }
  };

  const handleUpdatePassword = async () => {
    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match');
      setMessageType('error');
      return;
    }

    try {
      const response = await axios.post('http://localhost:3000/updatePassword', {
        table: updateTable,
        id: updateUserId,
        newPassword: newPassword
      });
      setMessage(response.data.message);
      setMessageType('success');
      setNewPassword('');
      setConfirmPassword('');
      setUpdateUserId('');
    } catch (error) {
      setMessage(error.response?.data?.message || error.message);
      setMessageType('error');
    }
  };

  return (
    <div className={adminStyles.c1}>
      <h1 className={adminStyles.c2}>Admin Dashboard</h1>
      
      {/* File Upload Section */}
      <div className={adminStyles.c3}>
        <h2 className={adminStyles.c4}>Upload the 'Student.csv' or 'Teacher.csv' here</h2>
        <form onSubmit={handleUpload} className={adminStyles.mb4}>
          <input type="file" accept=".csv" onChange={handleFileChange} className={adminStyles.mb2} />
          <button type="submit" className={adminStyles.c5}>Upload</button>
        </form>
        <h2 className={adminStyles.c4}>Reconfigure Database, this action resets the DB</h2>
        <button onClick={handleReset} className={adminStyles.c6}>Reset Database</button>
      </div>

      {/* View Password Section */}
      <div className={adminStyles.c3}>
        <h2 className={adminStyles.c4}>View Password and Push Mail</h2>
        <div className={adminStyles.spaceY4}>
          <div>
            <select 
              value={selectedTable}
              onChange={(e) => {
                setSelectedTable(e.target.value);
                setPassword('');
                setMessage('');
              }}
              className={adminStyles.c7}
            >
              <option value="Student">Student</option>
              <option value="Teacher">Teacher</option>
            </select>
            <input
              type="text"
              value={userId}
              onChange={(e) => {
                setUserId(e.target.value);
                setPassword('');
                setMessage('');
              }}
              placeholder={`Enter ${selectedTable} ID (PES${selectedTable === 'Teacher' ? '4' : '2'}...)`}
              className={adminStyles.c9}
            />
          </div>
          <button 
            onClick={handleViewPassword}
            className={adminStyles.c8}
          >
            View Password
          </button>
          {password && (
            <div className={adminStyles.c17}>
              <strong>Password:</strong> {password}
            </div>
          )}
        </div>
      </div>

      {/* Update Password Section */}
      <div className={adminStyles.c3}>
        <h2 className={adminStyles.c4}>Update Password and Push Mail</h2>
        <div className={adminStyles.spaceY4}>
          <div>
            <select 
              value={updateTable}
              onChange={(e) => {
                setUpdateTable(e.target.value);
                setMessage('');
              }}
              className={adminStyles.c7}
            >
              <option value="Student">Student</option>
              <option value="Teacher">Teacher</option>
            </select>
            <input
              type="text"
              value={updateUserId}
              onChange={(e) => {
                setUpdateUserId(e.target.value);
                setMessage('');
              }}
              placeholder={`Enter ${updateTable} ID (PES${updateTable === 'Teacher' ? '4' : '2'}...)`}
              className={adminStyles.c9}
            />
          </div>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New Password"
            className={adminStyles.c10}
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm New Password"
            className={adminStyles.c11}
          />
        </div>
        <button 
            onClick={handleUpdatePassword}
            className={adminStyles.c12}
          >
            Update Password
          </button>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`${adminStyles.c13} ${
          messageType === 'error' ? adminStyles.c14 : 
          messageType === 'success' ? adminStyles.c15 : 
          adminStyles.c16
        }`}>
          <p>{message}</p>
        </div>
      )}
    </div>
  );
};

export default App;