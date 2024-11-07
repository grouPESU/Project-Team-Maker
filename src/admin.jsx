import React, { useState } from 'react';
import axios from 'axios';
import styles from "./admin.module.css"

const App = () => {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessage('Please select a file to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://localhost:3000/upload', formData);
      setMessage(response.data.message);
      setFile(null);
    } catch (error) {
      if (error.response) {
        setMessage(`Error: ${error.response.data.message || error.message}`);
      } else {
        setMessage(`Error: ${error.message}`);
      }
    }
  };

  const handleReset = async () => {
    try {
      const response = await axios.post('http://localhost:3000/reset');
      setMessage(response.data.message);
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  };

  return (
    <div className="body gradient-background">
      <div className="content">
      <h1>Admin Dashboard</h1>
      <form onSubmit={handleUpload}>
        <input type="file" className="custom-file-upload" accept=".csv" onChange={handleFileChange} />
        <button className="button-85" type="submit">Upload</button>
      <button className="button-85" onClick={handleReset}>Reset Database</button>
      {message && <p>{message}</p>}
      </form>
      </div>
    </div>
  );
};

export default App;
