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

function MentorDashboard() {
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

  const [mentees, setMentees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [projectUsers, setProjectUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedStudents, setExpandedStudents] = useState(false);
  const [expandedProjects, setExpandedProjects] = useState(false);
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
      if (!user || !user.id) return;

      setLoading(true);
      try {
        const menteesResponse = await axios.get('/api/users/', {
          params: {
            mentor: user.id,
            role: 'student'
          }
        });
        const menteesData = menteesResponse.data.results || [];
        setMentees(menteesData);

        const projectsResponse = await axios.get('/api/projects/');
        const projectsData = projectsResponse.data.results || [];

        const projectUsersResponse = await axios.get('/api/project-users/');
        const projectUsersData = projectUsersResponse.data.results || [];
        setProjectUsers(projectUsersData);

        const menteeIds = menteesData.map((student) => student.id);
        const relatedProjectIds = projectUsersData
          .filter((relation) => menteeIds.includes(relation.user))
          .map((relation) => relation.project);

        const filteredProjectIds = [...new Set(relatedProjectIds)];
        const filteredProjects = projectsData.filter((project) => filteredProjectIds.includes(project.id));

        setProjects(filteredProjects);
      } catch (error) {
        console.error('Error fetching mentor dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

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

  const toggleStudents = () => setExpandedStudents((prev) => !prev);
  const toggleProjects = () => setExpandedProjects((prev) => !prev);

  const getProjectStudents = (projectId) => {
    return projectUsers
      .filter((relation) => relation.project === projectId)
      .map((relation) => relation.user_name);
  };

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
    <div className="dashboard-container mentor-dashboard">
      <nav className="navbar navbar-expand-lg navbar-light bg-white fixed-top">
        <div className="container-fluid">
          <span className="navbar-brand">FYPMS - Mentor Portal</span>
          <button className="btn btn-outline-dark ms-auto" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      <div className="container mt-5">
        <div className="welcome-section">
          <h1>
            Welcome back, <span className="role-name">{profile.first_name || profile.username || 'Mentor'}</span>.
          </h1>
          <p className="lead">
            Mentees: <strong>{mentees.length}</strong> | Projects: <strong>{projects.length}</strong>
            <br />
            Flagged duplicates: <strong>{flaggedProjects.length}</strong>
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
                  onClick={toggleStudents}
                >
                  <div>
                    <h5 className="card-title" style={{ marginBottom: 0 }}>👥 My Students</h5>
                    <p className="card-text">See the students assigned to you</p>
                  </div>
                  <span
                    style={{
                      fontSize: '1.5em',
                      color: '#007bff',
                      transform: expandedStudents ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.3s ease'
                    }}
                  >
                    ▼
                  </span>
                </div>

                {expandedStudents && (
                  <>
                    <hr />
                    {loading ? (
                      <p>Loading students...</p>
                    ) : mentees.length > 0 ? (
                      <ul style={{ marginBottom: 0 }}>
                        {mentees.map((student) => (
                          <li key={student.id} className="mb-3">
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

        <div className="row mt-4">
          <div className="col-md-12">
            <div className="card dashboard-card">
              <div className="card-body">
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                  onClick={toggleProjects}
                >
                  <div>
                    <h5 className="card-title" style={{ marginBottom: 0 }}>📁 Projects</h5>
                    <p className="card-text">Review flagged and normal projects from your students</p>
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
                                        <strong>Status:</strong> {project.status} | <strong>Students:</strong>{' '}
                                        {getProjectStudents(project.id).join(', ') || 'No students assigned'}
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
                                        <strong>Status:</strong> {project.status} | <strong>Students:</strong>{' '}
                                        {getProjectStudents(project.id).join(', ') || 'No students assigned'}
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
                      <p>No projects found for your students.</p>
                    )}
                    {projectMessage && <p className="mt-3 text-success">{projectMessage}</p>}
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
