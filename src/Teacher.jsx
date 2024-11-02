import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import styles from "./teacher.module.css";
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import ProfileBox from './Profile';

function App() {
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
  const navigate = useNavigate();

  useEffect(() => {
    fetchAssignments();
  }, []);

  const { user } = useAuth();
  const fetchAssignments = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/getAssignments?teacher_id=${user.id}`);
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
        classes: classes.split(',').map(c => c.trim()),
        teacher_id: user.id
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

  const handleViewGroups = (assignment) => {
    navigate('/groups', {
      state: {
        assignmentId: assignment.assignment_id,
        assignmentTitle: assignment.title,
        description: assignment.description
      }
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:5000/updateAssignment/${editingAssignment.assignment_id}`, {
        title,
        description,
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
    <div className={styles.mainBody}>
      <div className={styles.profileContainer}>
        <ProfileBox />
      </div>
      <div className={styles.app}>
        <h1 className={styles.title}>Teacher Dashboard</h1>
        <div className={styles.tabs}>
          <button 
            className={`${styles.tabButton} ${activeTab === 'create' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('create')}
          >
            Create Assignment
          </button>
          <button 
            className={`${styles.tabButton} ${activeTab === 'view' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('view')}
          >
            View Created Assignments
          </button>
        </div>

        {activeTab === 'create' && (
          <form className={styles.form} onSubmit={handleSubmit}>
            <input
              className={styles.input}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              required
            />
            <textarea
              className={styles.textarea}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description"
              required
            />
            <input
              className={styles.input}
              type="number"
              value={minTeamSize}
              onChange={(e) => setMinTeamSize(e.target.value)}
              placeholder="Min Team Size"
              required
            />
            <input
              className={styles.input}
              type="number"
              value={maxTeamSize}
              onChange={(e) => setMaxTeamSize(e.target.value)}
              placeholder="Max Team Size"
              required
            />
            <DatePicker
              className={styles.input}
              selected={deadline}
              onChange={(date) => setDeadline(date)}
              dateFormat="yyyy-MM-dd"
              placeholderText="Select a deadline"
              portalId="root"
            />
            <input
              className={styles.input}
              type="text"
              value={classes}
              onChange={(e) => setClasses(e.target.value)}
              placeholder="Classes (comma-separated)"
              required
            />
            <button className={styles.submitButton} type="submit">Create Assignment</button>
          </form>
        )}

        {activeTab === 'view' && (
          <div className={styles.assignments}>
            {assignments.map((assignment) => (
              <div key={assignment.assignment_id} className={styles.assignmentBox}>
                <h3 className={styles.assignmentTitle}>{assignment.title}</h3>
                <p className={styles.assignmentDescription}>{assignment.description}</p>
                <p className={styles.assignmentDetail}>Team Size: {assignment.min_team_size} - {assignment.max_team_size}</p>
                <p className={styles.assignmentDetail}>Deadline: {new Date(assignment.deadline).toLocaleDateString()}</p>
                <p className={styles.assignmentDetail}>Classes: {assignment.classes}</p>
                <div className={styles.buttonContainer}>
                  <button className={styles.editButton} onClick={() => handleEdit(assignment)}>Edit</button>
                  <button className={styles.deleteButton} onClick={() => handleDelete(assignment.assignment_id)}>Delete</button>
                  <button className={styles.viewButton} onClick={() => handleViewGroups(assignment)}>View Groups</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showEditPopup && (
          <div className={styles.popup}>
            <div className={styles.popupContent}>
              <h2 className={styles.popupTitle}>Edit Assignment</h2>
              <form className={styles.form} onSubmit={handleUpdate}>
                <input
                  className={styles.input}
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Title"
                  required
                />
                <textarea
                  className={styles.textarea}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Description"
                  required
                />
                <div className={styles.teamSizeDisplay}>
                  <p>Team Size (Fixed): {minTeamSize} - {maxTeamSize}</p>
                </div>
                <DatePicker
                  className={styles.datePicker}
                  selected={deadline}
                  onChange={(date) => setDeadline(date)}
                />
                <input
                  className={styles.input}
                  type="text"
                  value={classes}
                  onChange={(e) => setClasses(e.target.value)}
                  placeholder="Classes (comma-separated)"
                  required
                />
                <div className={styles.popupButtons}>
                  <button className={styles.updateButton} type="submit">Update Assignment</button>
                  <button className={styles.cancelButton} type="button" onClick={() => setShowEditPopup(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
