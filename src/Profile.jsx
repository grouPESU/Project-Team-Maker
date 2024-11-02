import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, ChevronDown } from 'lucide-react';
import styles from "./teacher.module.css"

const ProfileBox = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="relative">
      <div className={styles.profile}>
        <User/> {user.id}
      <br/>
        <button onClick={handleLogout} className={styles.tabButton}>
            LogOut
        </button>
      </div>
    </div>
  );
};

export default ProfileBox;
