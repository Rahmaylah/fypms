import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import '../styles/Dashboard.css';

function StudentDashboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-container student-dashboard">
      <nav className="navbar navbar-expand-lg navbar-light bg-white fixed-top">
        <div className="container-fluid">
          <span className="navbar-brand">FYPMS - Student Portal</span>
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
            Hello, <span className="role-name">{user?.username || 'Student'}</span>! 👋
          </h1>
          <p className="lead">Welcome to the Student Dashboard</p>
        </div>

        <div className="row mt-5">
          <div className="col-md-4">
            <div className="card dashboard-card">
              <div className="card-body">
                <h5 className="card-title">📝 My Project</h5>
                <p className="card-text">Submit and view your final year project</p>
                <button className="btn btn-success">Submit Project</button>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card dashboard-card">
              <div className="card-body">
                <h5 className="card-title">📅 My Appointments</h5>
                <p className="card-text">Schedule meetings with your mentor</p>
                <button className="btn btn-success">View Appointments</button>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card dashboard-card">
              <div className="card-body">
                <h5 className="card-title">👨‍🏫 My Mentor</h5>
                <p className="card-text">View your assigned mentor details</p>
                <button className="btn btn-success">View Mentor</button>
              </div>
            </div>
          </div>
        </div>

        <div className="row mt-4">
          <div className="col-md-12">
            <div className="card dashboard-card">
              <div className="card-body">
                <h5 className="card-title">🔍 Project Search</h5>
                <p className="card-text">Browse other projects and explore ideas</p>
                <button className="btn btn-success">Browse Projects</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;
