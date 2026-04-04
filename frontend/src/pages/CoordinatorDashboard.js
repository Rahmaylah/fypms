import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../services/axiosConfig';
import { AuthContext } from '../context/AuthContext';
import '../styles/Dashboard.css';

const STATUS_OPTIONS = [
  { value: 'proposed', label: 'Proposed' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'completed', label: 'Completed' },
];

function CoordinatorDashboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    email: '',
    username: '',
    role: ''
  });
  const [profileDraft, setProfileDraft] = useState({ middle_name: '', email: '' });
  const [profileExpanded, setProfileExpanded] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');

  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [duplicates, setDuplicates] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [expandedUsers, setExpandedUsers] = useState(false);
  const [expandedReports, setExpandedReports] = useState(false);
  const [expandedProjects, setExpandedProjects] = useState(false);
  const [expandedDuplicates, setExpandedDuplicates] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [projectSaving, setProjectSaving] = useState(false);
  const [projectMessage, setProjectMessage] = useState('');

  useEffect(() => {
    if (!user) return;

    setProfile({
      first_name: user.first_name || '',
      middle_name: user.middle_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
      username: user.username || '',
      role: user.role || ''
    });
    setProfileDraft({
      middle_name: user.middle_name || '',
      email: user.email || ''
    });
  }, [user]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch all users
        const usersResponse = await axios.get('/api/users/');
        const usersData = usersResponse.data.results;
        setUsers(usersData);

        // Fetch all projects
        const projectsResponse = await axios.get('/api/projects/');
        const projectsData = projectsResponse.data.results;
        setProjects(projectsData);

        // Fetch duplicate flags
        const duplicatesResponse = await axios.get('/api/duplicate-flags/');
        const duplicatesData = duplicatesResponse.data.results;
        setDuplicates(duplicatesData);

        // Calculate stats
        const totalUsers = usersResponse.data.count;
        const totalProjects = projectsResponse.data.count;
        const approvedProjects = projectsData.filter(p => p.status === 'approved').length;
        const flaggedDuplicates = duplicatesResponse.data.count;
        const mentors = usersData.filter(u => u.role === 'mentor').length;
        const students = usersData.filter(u => u.role === 'student').length;

        setStats({
          totalUsers,
          totalProjects,
          approvedProjects,
          flaggedDuplicates,
          mentors,
          students
        });

      } catch (error) {
        console.error('Error fetching coordinator dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleProfileDraftChange = (event) => {
    const { name, value } = event.target;
    setProfileDraft((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    if (!user || !user.id) return;
    setProfileSaving(true);
    setProfileMessage('');

    try {
      const response = await axios.patch(`/api/users/${user.id}/`, profileDraft);
      setProfile((prev) => ({ ...prev, ...response.data }));
      setProfileDraft({
        middle_name: response.data.middle_name || '',
        email: response.data.email || ''
      });
      setEditingProfile(false);
      setProfileMessage('Profile updated successfully.');
      localStorage.setItem('user', JSON.stringify({ ...user, ...response.data }));
    } catch (error) {
      console.error('Error saving profile:', error);
      setProfileMessage('Unable to update profile. Please try again.');
    } finally {
      setProfileSaving(false);
    }
  };

  const toggleUsers = () => setExpandedUsers(!expandedUsers);
  const toggleReports = () => setExpandedReports(!expandedReports);
  const toggleProjects = () => setExpandedProjects(!expandedProjects);
  const toggleDuplicates = () => setExpandedDuplicates(!expandedDuplicates);

  const toggleProjectDetails = (projectId) => {
    setSelectedProjectId((current) => (current === projectId ? null : projectId));
  };

  const handleProjectStatusChange = async (projectId, newStatus) => {
    setProjectSaving(true);
    setProjectMessage('');
    try {
      const response = await axios.patch(`/api/projects/${projectId}/`, { status: newStatus });
      setProjects((prevProjects) =>
        prevProjects.map((project) =>
          project.id === projectId ? { ...project, ...response.data } : project
        )
      );
      setProjectMessage('Project status updated successfully.');
    } catch (error) {
      console.error('Error updating project status:', error);
      setProjectMessage('Unable to update project status. Please try again.');
    } finally {
      setProjectSaving(false);
    }
  };

  const flaggedProjects = projects.filter((project) => project.is_flagged_duplicate);
  const normalProjects = projects.filter((project) => !project.is_flagged_duplicate);

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
            Welcome back, <span className="role-name">{profile.first_name || profile.username || 'Coordinator'}</span>.
          </h1>
          <p className="lead">
            Total users: <strong>{stats.totalUsers || 0}</strong> | Projects: <strong>{stats.totalProjects || 0}</strong>
            <br />
            Flagged duplicates: <strong>{stats.flaggedDuplicates || 0}</strong>
          </p>
        </div>

        <div className="row mt-5">
          <div className="col-md-6 mb-4">
            <div className="card dashboard-card">
              <div className="card-body">
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                  onClick={() => setProfileExpanded((prev) => !prev)}
                >
                  <div>
                    <h5 className="card-title" style={{ marginBottom: 0 }}>👤 Personal Profile</h5>
                    <p className="card-text">Update your middle name and email address</p>
                  </div>
                  <span
                    style={{
                      fontSize: '1.5em',
                      color: '#007bff',
                      transform: profileExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.3s ease'
                    }}
                  >
                    ▼
                  </span>
                </div>

                {profileExpanded && (
                  <>
                    <hr />
                    <div>
                      <p>
                        <strong>First Name:</strong> {profile.first_name || 'N/A'}
                      </p>
                      <p>
                        <strong>Last Name:</strong> {profile.last_name || 'N/A'}
                      </p>
                      <div className="mb-3">
                        <label className="form-label">Middle Name</label>
                        <input
                          type="text"
                          name="middle_name"
                          className="form-control"
                          value={profileDraft.middle_name}
                          onChange={handleProfileDraftChange}
                          disabled={!editingProfile}
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Email Address</label>
                        <input
                          type="email"
                          name="email"
                          className="form-control"
                          value={profileDraft.email}
                          onChange={handleProfileDraftChange}
                          disabled={!editingProfile}
                        />
                      </div>
                      {editingProfile ? (
                        <div className="d-flex gap-2">
                          <button className="btn btn-primary" onClick={handleSaveProfile} disabled={profileSaving}>
                            Save
                          </button>
                          <button
                            className="btn btn-outline-secondary"
                            onClick={() => {
                              setEditingProfile(false);
                              setProfileDraft({
                                middle_name: profile.middle_name || '',
                                email: profile.email || ''
                              });
                            }}
                            disabled={profileSaving}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button className="btn btn-secondary" onClick={() => setEditingProfile(true)}>
                          Edit Details
                        </button>
                      )}
                      {profileMessage && <p className="mt-3 text-success">{profileMessage}</p>}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="col-md-6 mb-4">
            <div className="card dashboard-card">
              <div className="card-body">
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                  onClick={toggleUsers}
                >
                  <div>
                    <h5 className="card-title" style={{ marginBottom: 0 }}>👥 Manage Users</h5>
                    <p className="card-text">View and manage all system users</p>
                  </div>
                  <span
                    style={{
                      fontSize: '1.5em',
                      color: '#007bff',
                      transform: expandedUsers ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.3s ease'
                    }}
                  >
                    ▼
                  </span>
                </div>

                {expandedUsers && (
                  <>
                    <hr />
                    {loading ? (
                      <p>Loading users...</p>
                    ) : users.length > 0 ? (
                      <div className="table-responsive">
                        <table className="table table-striped">
                          <thead>
                            <tr>
                              <th>Name</th>
                              <th>Username</th>
                              <th>Email</th>
                              <th>Role</th>
                            </tr>
                          </thead>
                          <tbody>
                            {users.map((u) => (
                              <tr key={u.id}>
                                <td>{u.first_name} {u.middle_name} {u.last_name}</td>
                                <td>{u.username}</td>
                                <td>{u.email}</td>
                                <td>{u.role}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p>No users found.</p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="row mt-4">
          <div className="col-md-12">
            <div className="card dashboard-card">
              <div className="card-body">
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                  onClick={toggleReports}
                >
                  <div>
                    <h5 className="card-title" style={{ marginBottom: 0 }}>📊 System Reports</h5>
                    <p className="card-text">View system statistics and analytics</p>
                  </div>
                  <span
                    style={{
                      fontSize: '1.5em',
                      color: '#007bff',
                      transform: expandedReports ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.3s ease'
                    }}
                  >
                    ▼
                  </span>
                </div>

                {expandedReports && (
                  <>
                    <hr />
                    {loading ? (
                      <p>Loading stats...</p>
                    ) : (
                      <div className="row">
                        <div className="col-md-3">
                          <div className="card text-center">
                            <div className="card-body">
                              <h3>{stats.totalUsers || 0}</h3>
                              <p>Total Users</p>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="card text-center">
                            <div className="card-body">
                              <h3>{stats.totalProjects || 0}</h3>
                              <p>Total Projects</p>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="card text-center">
                            <div className="card-body">
                              <h3>{stats.approvedProjects || 0}</h3>
                              <p>Approved Projects</p>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="card text-center">
                            <div className="card-body">
                              <h3>{stats.flaggedDuplicates || 0}</h3>
                              <p>Flagged Duplicates</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="row mt-4">
          <div className="col-md-12">
            <div className="card dashboard-card">
              <div className="card-body">
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                  onClick={toggleProjects}
                >
                  <div>
                    <h5 className="card-title" style={{ marginBottom: 0 }}>📋 All Projects</h5>
                    <p className="card-text">Review and manage all projects in the system</p>
                  </div>
                  <span
                    style={{
                      fontSize: '1.5em',
                      color: '#007bff',
                      transform: expandedProjects ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.3s ease'
                    }}
                  >
                    ▼
                  </span>
                </div>

                {expandedProjects && (
                  <>
                    <hr />
                    {loading ? (
                      <p>Loading projects...</p>
                    ) : projects.length > 0 ? (
                      <>
                        {flaggedProjects.length > 0 && (
                          <div className="mb-4">
                            <h6>Flagged Projects</h6>
                            <div className="list-group">
                              {flaggedProjects.map((project) => (
                                <div
                                  key={project.id}
                                  className={`list-group-item ${selectedProjectId === project.id ? 'active' : ''}`}
                                  style={{ cursor: 'pointer' }}
                                  onClick={() => toggleProjectDetails(project.id)}
                                >
                                  <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                      <h6>{project.title}</h6>
                                      <p className="mb-1">
                                        <strong>Status:</strong> {project.status} | <strong>Student:</strong> {project.user.first_name} {project.user.last_name}
                                      </p>
                                      <small className="text-muted">
                                        Type: {project.project_type_name || 'N/A'} | Year: {project.year}
                                      </small>
                                    </div>
                                    <span style={{ fontSize: '1.4em', color: '#007bff' }}>▶</span>
                                  </div>
                                  {selectedProjectId === project.id && (
                                    <div className="mt-3">
                                      <p><strong>Main Objective:</strong> {project.main_objective || 'N/A'}</p>
                                      <p><strong>Specific Objectives:</strong> {Array.isArray(project.specific_objectives) ? project.specific_objectives.join(', ') : project.specific_objectives || 'N/A'}</p>
                                      <p><strong>Description:</strong> {project.project_description || 'N/A'}</p>
                                      <p><strong>Implementation:</strong> {project.implementation_details || 'N/A'}</p>
                                      <p><strong>Flagged Duplicate:</strong> {project.is_flagged_duplicate ? 'Yes' : 'No'}</p>
                                      <div className="mb-3">
                                        <label className="form-label"><strong>Change Status</strong></label>
                                        <select
                                          className="form-select"
                                          value={project.status}
                                          onChange={(e) => handleProjectStatusChange(project.id, e.target.value)}
                                          disabled={projectSaving}
                                        >
                                          {STATUS_OPTIONS.map((option) => (
                                            <option key={option.value} value={option.value}>
                                              {option.label}
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div>
                          <h6>Other Projects</h6>
                          {normalProjects.length > 0 ? (
                            <div className="list-group">
                              {normalProjects.map((project) => (
                                <div
                                  key={project.id}
                                  className={`list-group-item ${selectedProjectId === project.id ? 'active' : ''}`}
                                  style={{ cursor: 'pointer' }}
                                  onClick={() => toggleProjectDetails(project.id)}
                                >
                                  <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                      <h6>{project.title}</h6>
                                      <p className="mb-1">
                                        <strong>Status:</strong> {project.status} | <strong>Student:</strong> {project.user.first_name} {project.user.last_name}
                                      </p>
                                      <small className="text-muted">
                                        Type: {project.project_type_name || 'N/A'} | Year: {project.year}
                                      </small>
                                    </div>
                                    <span style={{ fontSize: '1.4em', color: '#007bff' }}>▶</span>
                                  </div>
                                  {selectedProjectId === project.id && (
                                    <div className="mt-3">
                                      <p><strong>Main Objective:</strong> {project.main_objective || 'N/A'}</p>
                                      <p><strong>Specific Objectives:</strong> {Array.isArray(project.specific_objectives) ? project.specific_objectives.join(', ') : project.specific_objectives || 'N/A'}</p>
                                      <p><strong>Description:</strong> {project.project_description || 'N/A'}</p>
                                      <p><strong>Implementation:</strong> {project.implementation_details || 'N/A'}</p>
                                      <p><strong>Flagged Duplicate:</strong> {project.is_flagged_duplicate ? 'Yes' : 'No'}</p>
                                      <div className="mb-3">
                                        <label className="form-label"><strong>Change Status</strong></label>
                                        <select
                                          className="form-select"
                                          value={project.status}
                                          onChange={(e) => handleProjectStatusChange(project.id, e.target.value)}
                                          disabled={projectSaving}
                                        >
                                          {STATUS_OPTIONS.map((option) => (
                                            <option key={option.value} value={option.value}>
                                              {option.label}
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p>No non-flagged projects found.</p>
                          )}
                        </div>
                      </>
                    ) : (
                      <p>No projects found.</p>
                    )}
                    {projectMessage && <p className="mt-3 text-success">{projectMessage}</p>}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="row mt-4">
          <div className="col-md-12">
            <div className="card dashboard-card">
              <div className="card-body">
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                  onClick={toggleDuplicates}
                >
                  <div>
                    <h5 className="card-title" style={{ marginBottom: 0 }}>⚠️ Duplicate Review</h5>
                    <p className="card-text">Review and manage flagged duplicate projects</p>
                  </div>
                  <span
                    style={{
                      fontSize: '1.5em',
                      color: '#007bff',
                      transform: expandedDuplicates ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.3s ease'
                    }}
                  >
                    ▼
                  </span>
                </div>

                {expandedDuplicates && (
                  <>
                    <hr />
                    {loading ? (
                      <p>Loading duplicates...</p>
                    ) : duplicates.length > 0 ? (
                      <div className="list-group">
                        {duplicates.map((flag) => (
                          <div key={flag.id} className="list-group-item">
                            <h6>Project: {flag.project.title}</h6>
                            <p><strong>Similar to:</strong> {flag.similar_project.title}</p>
                            <p><strong>Similarity Score:</strong> {(flag.similarity_score * 100).toFixed(2)}%</p>
                            <p><strong>Reviewed:</strong> {flag.reviewed ? 'Yes' : 'No'}</p>
                            <small className="text-muted">Flagged: {new Date(flag.created_at).toLocaleDateString()}</small>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p>No flagged duplicates.</p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="row mt-4">
          <div className="col-md-6">
            <div className="card dashboard-card">
              <div className="card-body">
                <h5 className="card-title">⚙️ Settings</h5>
                <p className="card-text">Configure system settings and parameters</p>
                <button className="btn btn-secondary" disabled>
                  Coming Soon
                </button>
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="card dashboard-card">
              <div className="card-body">
                <h5 className="card-title">🔄 Bulk Operations</h5>
                <p className="card-text">Perform bulk operations like mentor assignment and data export</p>
                <button className="btn btn-secondary" disabled>
                  Coming Soon
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CoordinatorDashboard;
