import React, { useState } from 'react';
import axios from 'axios';
//import './admin.module.css'

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
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      
      {/* File Upload Section */}
      <div className="mb-8 p-4 border rounded">
        <h2 className="text-xl font-semibold mb-4">Upload the 'Student.csv' or 'Teacher.csv' here</h2>
        <form onSubmit={handleUpload} className="mb-4">
          <input type="file" accept=".csv" onChange={handleFileChange} className="mb-2" />
          <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded mr-2">Upload</button>
        </form>
        <h2 className="text-xl font-semibold mb-4">Reconfigure Database, this action resets the DB</h2>
        <button onClick={handleReset} className="bg-red-500 text-white px-4 py-2 rounded">Reset Database</button>
      </div>

      {/* View Password Section */}
      <div className="mb-8 p-4 border rounded">
        <h2 className="text-xl font-semibold mb-4">View Password and Push Mail</h2>
        <div className="space-y-4">
          <div>
            <select 
              value={selectedTable}
              onChange={(e) => {
                setSelectedTable(e.target.value);
                setPassword('');
                setMessage('');
              }}
              className="border p-2 rounded mr-2"
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
              className="border p-2 rounded"
            />
          </div>
          <button 
            onClick={handleViewPassword}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            View Password
          </button>
          {password && (
            <div className="mt-2 p-2 bg-green-100 border border-green-300 rounded">
              <strong>Password:</strong> {password}
            </div>
          )}
        </div>
      </div>

      {/* Update Password Section */}
      <div className="mb-8 p-4 border rounded">
        <h2 className="text-xl font-semibold mb-4">Update Password and Push Mail</h2>
        <div className="space-y-4">
          <div>
            <select 
              value={updateTable}
              onChange={(e) => {
                setUpdateTable(e.target.value);
                setMessage('');
              }}
              className="border p-2 rounded mr-2"
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
              className="border p-2 rounded"
            />
          </div>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New Password"
            className="border p-2 rounded block w-full mb-2"
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm New Password"
            className="border p-2 rounded block w-full"
          />
        </div>
        <button 
            onClick={handleUpdatePassword}
            className="bg-yellow-500 text-white px-4 py-2 rounded"
          >
            Update Password
          </button>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`p-4 border rounded ${
          messageType === 'error' ? 'bg-red-100 border-red-300 text-red-700' : 
          messageType === 'success' ? 'bg-green-100 border-green-300 text-green-700' : 
          'bg-gray-100 border-gray-300'
        }`}>
          <p>{message}</p>
        </div>
      )}
    </div>
  );
};

export default App;
