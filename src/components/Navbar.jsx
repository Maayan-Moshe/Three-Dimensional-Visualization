import React from 'react';
import './Navbar.css';

const Navbar = ({ onUpload, onClear }) => {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-content">
          <div className="navbar-left">
            {/* Upload and Clear Buttons */}
            <label className="navbar-upload-label">
              Upload Meshes
              <input 
                type="file" 
                multiple 
                accept=".obj,.stl,.gltf,.glb" 
                className="navbar-upload-input" 
                onChange={onUpload} 
              />
            </label>
            <button 
              onClick={onClear}
              className="navbar-clear-button"
            >
              Clear All
            </button>
          </div>
          
          <div className="navbar-right">
            {/* Bell Icon */}
            <button className="navbar-notification-button">
              <span className="navbar-sr-only">View notifications</span>
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;