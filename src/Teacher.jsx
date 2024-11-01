import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import styles from "./teacher.module.css"

function Assignment() {
  const [activeTab, setActiveTab] = useState('create');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [minTeamSize, setMinTeamSize] = useState('');
  const [maxTeamSize, setMaxTeamSize] = useState('');
  const [deadline, setDeadline] = useState(new Date());
  const [classes, setClasses] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [showEditPopup, setShowEditPopup] = useState(false);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const response = await axios.get('http://localhost:5000/getAssignments');
      setAssignments(response.data);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/createAssignment', {
        title,
        description,
        min_team_size: parseInt(minTeamSize),
        max_team_size: parseInt(maxTeamSize),
        deadline: deadline.toISOString().split('T')[0],
        classes: classes.split(',').map(c => c.trim())
      });
      alert('Assignment created successfully');
      resetForm();
      fetchAssignments();
    } catch (error) {
      console.error('Error creating assignment:', error);
    }
  };

  const handleEdit = (assignment) => {
    setEditingAssignment(assignment);
    setTitle(assignment.title);
    setDescription(assignment.description);
    setMinTeamSize(assignment.min_team_size);
    setMaxTeamSize(assignment.max_team_size);
    setDeadline(new Date(assignment.deadline));
    setClasses(assignment.classes);
    setShowEditPopup(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:5000/updateAssignment/${editingAssignment.assignment_id}`, {
        title,
        description,
        min_team_size: parseInt(minTeamSize),
        max_team_size: parseInt(maxTeamSize),
        deadline: deadline.toISOString().split('T')[0],
        classes: classes.split(',').map(c => c.trim())
      });
      alert('Assignment updated successfully');
      resetForm();
      setEditingAssignment(null);
      setShowEditPopup(false);
      fetchAssignments();
    } catch (error) {
      console.error('Error updating assignment:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this assignment?')) {
      try {
        await axios.delete(`http://localhost:5000/deleteAssignment/${id}`);
        alert('Assignment deleted successfully');
        fetchAssignments();
      } catch (error) {
        console.error('Error deleting assignment:', error);
      }
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setMinTeamSize('');
    setMaxTeamSize('');
    setDeadline(new Date());
    setClasses('');
  };

  return (
    <div className="App gradient-background">
      <h1>Teacher Dashboard</h1>
      <div className="tabs">
        <button onClick={() => setActiveTab('create')}>Create Assignment</button>
        <button onClick={() => setActiveTab('view')}>View Created Assignments</button>
      </div>

      {activeTab === 'create' && (
        <form onSubmit={handleSubmit}>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" required />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" required />
          <input type="number" value={minTeamSize} onChange={(e) => setMinTeamSize(e.target.value)} placeholder="Min Team Size" required />
          <input type="number" value={maxTeamSize} onChange={(e) => setMaxTeamSize(e.target.value)} placeholder="Max Team Size" required />
          <DatePicker selected={deadline} onChange={(date) => setDeadline(date)} />
          <input type="text" value={classes} onChange={(e) => setClasses(e.target.value)} placeholder="Classes (comma-separated)" required />
          <button type="submit">Create Assignment</button>
        </form>
      )}

      {activeTab === 'view' && (
        <div className="assignments">
          {assignments.map((assignment) => (
            <div key={assignment.assignment_id} className="assignment-box">
              <h3>{assignment.title}</h3>
              <p>{assignment.description}</p>
              <p>Team Size: {assignment.min_team_size} - {assignment.max_team_size}</p>
              <p>Deadline: {new Date(assignment.deadline).toLocaleDateString()}</p>
              <p>Classes: {assignment.classes}</p>
              <button onClick={() => handleEdit(assignment)}>Edit</button>
              <button onClick={() => handleDelete(assignment.assignment_id)}>Delete</button>
            </div>
          ))}
        </div>
      )}

      {showEditPopup && (
        <div className="popup">
          <div className="popup-content">
            <h2>Edit Assignment</h2>
            <form onSubmit={handleUpdate}>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" required />
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" required />
              <input type="number" value={minTeamSize} onChange={(e) => setMinTeamSize(e.target.value)} placeholder="Min Team Size" required />
              <input type="number" value={maxTeamSize} onChange={(e) => setMaxTeamSize(e.target.value)} placeholder="Max Team Size" required />
              <DatePicker selected={deadline} onChange={(date) => setDeadline(date)} />
              <input type="text" value={classes} onChange={(e) => setClasses(e.target.value)} placeholder="Classes (comma-separated)" required />
              <button type="submit">Update Assignment</button>
              <button type="button" onClick={() => setShowEditPopup(false)}>Cancel</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Assignment;
