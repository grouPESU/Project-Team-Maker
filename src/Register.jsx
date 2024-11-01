import { useState } from 'react';
import styles from "./login.module.css";
import Typewriter from 'typewriter-effect';

function TypewriterComponent() {
    return (
        <div className={styles.typewriterContainer}>
        <Typewriter
        options={{
            strings: ['Welcome :D', 'Create Teams Effortlessly', 'No more confusions'],
                autoStart: true,
                loop: true,
                delay: 75,
                deleteSpeed: 50,
                cursor: '|',
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
        <div className={styles.loginContainer}>
        <div className={styles.leftSection}>
        <h1 className={styles.logo}>GrouPES</h1>
        <TypewriterComponent />
        </div>

        <div className={styles.rightSection}>
        <div className={`${styles.loginBox} ${styles.box}`}>
        <h2>Register</h2>
        <p className={styles.subtitle}>Create your account</p>

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
            <div className={styles.successMessage}>
            {success}
            <div className={styles.loginLink}>
            <a href="/login">Go to Login</a>
            </div>
            </div>
        )}

        <button 
        type="submit" 
        disabled={isLoading}
        className={styles.submitButton}
        >
        {isLoading ? 'Registering...' : 'Register'}
        </button>

        <div className={styles.loginLink}>
        Already have an account? <a href="/login">Login here</a>
        </div>
        </form>
        </div>
        </div>

        <footer className={styles.footer}>
        Created with 🧠 by Narayan and Sashank.
        </footer>
        </div>
    );
}
