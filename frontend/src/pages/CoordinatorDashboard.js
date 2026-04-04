import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import '../styles/Dashboard.css';

function CoordinatorDashboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-container admin-dashboard">
      <nav className="navbar navbar-expand-lg navbar-light bg-white fixed-top">
        <div className="container-fluid">
          <span className="navbar-brand">FYPMS - Coordinator Dashboard</span>
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
            Hello, <span className="role-name">{user?.username || 'Admin'}</span>! 👋
          </h1>
          <p className="lead">Welcome to the Admin Dashboard</p>
        </div>

        <div className="row mt-5">
          <div className="col-md-4">
            <div className="card dashboard-card">
              <div className="card-body">
                <h5 className="card-title">👥 Manage Users</h5>
                <p className="card-text">Create, edit, and manage system users</p>
                <button className="btn btn-danger">Manage Users</button>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card dashboard-card">
              <div className="card-body">
                <h5 className="card-title">📊 System Reports</h5>
                <p className="card-text">View system statistics and analytics</p>
                <button className="btn btn-danger">View Reports</button>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card dashboard-card">
              <div className="card-body">
                <h5 className="card-title">⚙️ Settings</h5>
                <p className="card-text">Configure system settings and parameters</p>
                <button className="btn btn-danger">Go to Settings</button>
              </div>
            </div>
          </div>
        </div>

        <div className="row mt-4">
          <div className="col-md-6">
            <div className="card dashboard-card">
              <div className="card-body">
                <h5 className="card-title">📋 All Projects</h5>
                <p className="card-text">Review and manage all projects in the system</p>
                <button className="btn btn-danger">View All Projects</button>
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="card dashboard-card">
              <div className="card-body">
                <h5 className="card-title">⚠️ Duplicate Review</h5>
                <p className="card-text">Review and manage flagged duplicate projects</p>
                <button className="btn btn-danger">Review Duplicates</button>
              </div>
            </div>
          </div>
        </div>

        <div className="row mt-4">
          <div className="col-md-12">
            <div className="card dashboard-card">
              <div className="card-body">
                <h5 className="card-title">🔄 Bulk Operations</h5>
                <p className="card-text">Perform bulk operations like mentor assignment and data export</p>
                <button className="btn btn-danger">Bulk Operations</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CoordinatorDashboard;
