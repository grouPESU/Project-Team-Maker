// src/Login.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext'; // You'll need to create this
import loginStyles from "./login.module.css"
import Typewriter from 'typewriter-effect';

function TypewriterComponent() {
    return (
        <div className={loginStyles.typewriterContainer}>
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

export default function LoginForm() {
    const navigate = useNavigate();

    const handleRegisterClick = () => {
        navigate('/register');
    };

    const { login } = useAuth();

    const [formData, setFormData] = useState({
        username: '',
        password: '',
        role: ''
    });
    const [error, setError] = useState('');
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

        try {
            const response = await fetch('http://localhost:3002/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // Important for cookies
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            // Store user data in context
            login(data.user);

            // Navigate based on role
            switch (formData.role) {
                case 'admin':
                    navigate('/admin');
                    break;
                case 'teacher':
                    navigate('/teacher');
                    break;
                case 'student':
                    navigate('/main');
                    break;
                default:
                    navigate('/main');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };
    return (
        <div className={loginStyles.loginContainer}>
        <div className={loginStyles.leftSection}>
        <h1 className={loginStyles.logo}>GrouPES</h1>
        <TypewriterComponent />
        </div>

        <div className={loginStyles.rightSection}>
        <div className={`${loginStyles.loginBox} ${loginStyles.box}`}>
        <h2>Sign In to GrouPES</h2>
        <p className={loginStyles.subtitle}>Enter your credentials to access your account</p>

        <form onSubmit={handleSubmit}>
        {/* Keep all your existing form elements */}
        <div className={loginStyles.formGroup}>
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
        <div className={loginStyles.formGroup}>
        <label htmlFor="username">Username</label>
        <input
        id="username"
        name="username"
        type="text"
        required
        value={formData.username}
        onChange={handleChange}
        placeholder="Enter your username"
        />
        </div>
        <div className={loginStyles.formGroup}>
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
        {error && <div className={loginStyles.errorMessage}>{error}</div>}
        <button 
        type="submit" 
        disabled={isLoading}
        className={loginStyles.submitButton}
        >
        {isLoading ? 'Signing in...' : 'Sign in'}
        </button>
        <button 
        type="button" 
        onClick={handleRegisterClick} 
        className={loginStyles.submitButton}
        >
        Register
        </button>
        </form>
        </div>
        </div>

        <footer className={loginStyles.footer}>
        Created with 🧠 by Narayan and Sashank.
        </footer>
        </div>
    );
}
