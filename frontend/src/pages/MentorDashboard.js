import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import '../styles/Dashboard.css';

function MentorDashboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-container mentor-dashboard">
      <nav className="navbar navbar-expand-lg navbar-light bg-white fixed-top">
        <div className="container-fluid">
          <span className="navbar-brand">FYPMS - Mentor Portal</span>
          <button
            className="btn btn-outline-dark ms-auto"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="container mt-5">
        <div className="welcome-section">
          <h1>
            Hello, <span className="role-name">{user?.username || 'Mentor'}</span>! 👋
          </h1>
          <p className="lead">Welcome to the Mentor Dashboard</p>
        </div>

        <div className="row mt-5">
          <div className="col-md-4">
            <div className="card dashboard-card">
              <div className="card-body">
                <h5 className="card-title">My Projects</h5>
                <p className="card-text">View and manage projects assigned to you</p>
                <button className="btn btn-primary">View Projects</button>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card dashboard-card">
              <div className="card-body">
                <h5 className="card-title">Appointments</h5>
                <p className="card-text">Schedule and manage student meetings</p>
                <button className="btn btn-primary">View Schedule</button>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card dashboard-card">
              <div className="card-body">
                <h5 className="card-title">Duplicates</h5>
                <p className="card-text">Review flagged duplicate projects</p>
                <button className="btn btn-primary">View Duplicates</button>
              </div>
            </div>
          </div>
        </div>

        <div className="row mt-4">
          <div className="col-md-12">
            <div className="card dashboard-card">
              <div className="card-body">
                <h5 className="card-title">👥 My Students</h5>
                <p className="card-text">Manage students assigned to you</p>
                <button className="btn btn-primary">View Students</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MentorDashboard;
