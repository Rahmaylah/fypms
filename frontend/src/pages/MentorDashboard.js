import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../services/axiosConfig';
import { AuthContext } from '../context/AuthContext';
import '../styles/Dashboard.css';

function MentorDashboard() {
  const { user, logout } = useContext(AuthContext);
  const [mentees, setMentees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);  // Track if students section is expanded
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMentees = async () => {
      if (!user || !user.id) return;
      try {
        const response = await axios.get('/api/users/', {
          params: {
            mentor: user.id,
            role: 'student'
          }
        });
        setMentees(response.data.results);
      } catch (error) {
        console.error('Error fetching mentees:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMentees();
  }, [user]);

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
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer'
                }} onClick={() => setExpanded(!expanded)}>
                  <div>
                    <h5 className="card-title" style={{ marginBottom: 0 }}>👥 My Students</h5>
                    <p className="card-text">Manage students assigned to you</p>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <span style={{
                      fontSize: '1.2em',
                      fontWeight: 'bold',
                      color: '#007bff',
                      minWidth: '30px',
                      textAlign: 'right'
                    }}>
                      {mentees.length}
                    </span>
                    <span style={{
                      fontSize: '1.5em',
                      color: '#007bff',
                      transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.3s ease'
                    }}>
                      ▼
                    </span>
                  </div>
                </div>

                {expanded && (
                  <>
                    <hr />
                    {loading ? (
                      <p>Loading students...</p>
                    ) : mentees.length > 0 ? (
                      <ul style={{ marginBottom: 0 }}>
                        {mentees.map((student) => (
                          <li key={student.id}>
                            <strong>{student.first_name} {student.middle_name} {student.last_name}</strong>
                            <br />
                            <small style={{ color: '#666' }}>@{student.username} | {student.email}</small>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>No students assigned yet.</p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MentorDashboard;
