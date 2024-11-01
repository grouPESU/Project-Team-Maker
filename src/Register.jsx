import { useState } from 'react';
import styles from "./login.module.css"

import Typewriter from 'typewriter-effect';

function TypewriterComponent() {
  return (
    <div className={styles.typewriterContainer}>
      <Typewriter
        options={{
            strings: ['Welcome :D', 'Create Teams Effortlessly', 'No more confusions'],
          autoStart: true,
          loop: true,
          delay: 75,        // Controls typing speed
          deleteSpeed: 50,  // Controls delete speed
          cursor: '|',      // Custom cursor character
        }}
      />
    </div>
  );
}
export default function RegistrationForm() {
  const [formData, setFormData] = useState({
    id: '',
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
    dob: '',
    role: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    // Basic validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:3002/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          id: formData.id,
          firstName: formData.firstName,
          lastName: formData.lastName,
          dob: formData.dob,
          password: formData.password,
          role: formData.role.toLowerCase()
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      setSuccess('Registration successful! You can now login.');
      // Clear form after successful registration
      setFormData({
        id: '',
        firstName: '',
        lastName: '',
        password: '',
        confirmPassword: '',
        dob: '',
        role: ''
      });
      
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Failed to connect to the server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getIdLabel = () => {
    switch (formData.role.toLowerCase()) {
      case 'admin':
        return 'Admin ID';
      case 'student':
        return 'Student ID';
      case 'teacher':
        return 'Teacher ID';
      default:
        return 'ID';
    }
  };

  return (
    <div className="registration-container gradient-background">
      <h1 className={styles.logo}> GrouPES </h1>
      <TypewriterComponent />

      <div className="registration-box">
        <h2>Register</h2>
        <p className="subtitle">Create your account</p>
        
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="role">Role</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
            >
              <option value="">Select your role</option>
              <option value="admin">Admin</option>
              <option value="teacher">Teacher</option>
              <option value="student">Student</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="id">{getIdLabel()}</label>
            <input
              id="id"
              name="id"
              type="text"
              required
              value={formData.id}
              onChange={handleChange}
              placeholder={`Enter your ${getIdLabel().toLowerCase()}`}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="firstName">First Name</label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              required
              value={formData.firstName}
              onChange={handleChange}
              placeholder="Enter your first name"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="lastName">Last Name</label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              required
              value={formData.lastName}
              onChange={handleChange}
              placeholder="Enter your last name"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="dob">Date of Birth</label>
            <input
              id="dob"
              name="dob"
              type="date"
              required
              value={formData.dob}
              onChange={handleChange}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
            />
          </div>

          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}
          {success && (
            <div className="success-message">
              {success}
              <div className="login-link">
                <a href="/login">Go to Login</a>
              </div>
            </div>
          )}

          <button 
            type="submit" 
            disabled={isLoading}
            className="submit-button"
          >
            {isLoading ? 'Registering...' : 'Register'}
          </button>

          <div className="login-link">
            Already have an account? <a href="/login">Login here</a>
          </div>
        </form>
      </div>

      <style jsx>{`
        .registration-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: var(--background);
          padding: 20px;
          min-width: 50vw;
        }

        .registration-box {
          background: white;
          padding: 2rem;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          width: 100%;
          max-width: 400px;
        }

        h2 {
          text-align: center;
          color: #333;
          margin-bottom: 0.5rem;
          font-size: 1.5rem;
        }

        .subtitle {
          text-align: center;
          color: #666;
          margin-bottom: 1.5rem;
          font-size: 0.875rem;
        }

        .form-group {
          margin-bottom: 1rem;
        }

        label {
          display: block;
          margin-bottom: 0.5rem;
          color: #333;
          font-size: 0.875rem;
        }

        input, select {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 1rem;
          margin-bottom: 0.5rem;
        }

        input:focus, select:focus {
          outline: none;
          border-color: #4a90e2;
          box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.2);
        }

        .submit-button {
          width: 100%;
          padding: 0.75rem;
          background-color: #4a90e2;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 1rem;
          cursor: pointer;
          transition: background-color 0.2s;
          margin-bottom: 1rem;
        }

        .submit-button:hover {
          background-color: #357abd;
        }

        .submit-button:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }

        .error-message {
          background-color: #fee2e2;
          color: #dc2626;
          padding: 0.75rem;
          border-radius: 4px;
          margin-bottom: 1rem;
          font-size: 0.875rem;
        }

        .success-message {
          background-color: #ecfdf5;
          color: #059669;
          padding: 0.75rem;
          border-radius: 4px;
          margin-bottom: 1rem;
          font-size: 0.875rem;
        }

        .login-link {
          text-align: center;
          margin-top: 1rem;
          font-size: 0.875rem;
          color: #666;
        }

        .login-link a {
          color: #4a90e2;
          text-decoration: none;
        }

        .login-link a:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
