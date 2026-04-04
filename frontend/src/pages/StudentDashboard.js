import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from '../services/axiosConfig';
import '../styles/Dashboard.css';
import nitLogo from '../assets/nit.png';

function StudentDashboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [mentor, setMentor] = useState(null);
  const [mentorExpanded, setMentorExpanded] = useState(false);
  const [project, setProject] = useState(null);
  const [projectTypes, setProjectTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Form state for editing
  const [formData, setFormData] = useState({
    title: '',
    project_type: '',
    main_objective: '',
    specific_objectives: '',
    project_description: '',
    implementation_details: ''
  });

  // Fetch project types from database
  useEffect(() => {
    const fetchProjectTypes = async () => {
      try {
        const response = await axios.get('/api/project-types/');
        setProjectTypes(response.data.results || response.data);
      } catch (error) {
        console.error('Error fetching project types:', error);
      }
    };
    fetchProjectTypes();
  }, []);

  // Fetch projects and mentor info
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch user's projects directly (backend will filter by authenticated user)
        const projectsResponse = await axios.get('/api/projects/');

        if (projectsResponse.data.results && projectsResponse.data.results.length > 0) {
          // Get the first project (student should have max 1 project)
          const projectData = projectsResponse.data.results[0];
          setProject(projectData);
          
          // Initialize form with existing project data
          setFormData({
            title: projectData.title || '',
            project_type: projectData.project_type || '',
            main_objective: projectData.main_objective || '',
            specific_objectives: projectData.specific_objectives?.join('--') || '',
            project_description: projectData.project_description || '',
            implementation_details: projectData.implementation_details || ''
          });
        } else {
          setProject(null);
          // Reset form for new project
          setFormData({
            title: '',
            project_type: '',
            main_objective: '',
            specific_objectives: '',
            project_description: '',
            implementation_details: ''
          });
        }

        // Set mentor info from user
        setMentor(user?.mentor_info);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form to original data
    if (project) {
      setFormData({
        title: project.title || '',
        project_type: project.project_type || '',
        main_objective: project.main_objective || '',
        specific_objectives: project.specific_objectives?.join('--') || '',
        project_description: project.project_description || '',
        implementation_details: project.implementation_details || ''
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      // Convert specific_objectives string to array
      const specificObjArray = formData.specific_objectives
        ? formData.specific_objectives.split('--').map(obj => obj.trim()).filter(obj => obj)
        : [];

      const projectData = {
        title: formData.title,
        project_type: formData.project_type || null,
        main_objective: formData.main_objective,
        specific_objectives: specificObjArray,
        project_description: formData.project_description,
        implementation_details: formData.implementation_details,
        year: new Date().getFullYear(),
        status: 'proposed'
      };

      if (project && project.id) {
        // Update existing project
        const response = await axios.put(`/api/projects/${project.id}/`, projectData);
        setProject(response.data);
      } else {
        // Create new project
        const response = await axios.post('/api/projects/', projectData);
        setProject(response.data);
      }

      setIsEditing(false);
      alert('Project saved successfully!');
    } catch (error) {
      console.error('Error saving project:', error);
      alert('Error saving project. Please try again.');
    }
  };


  return (
    <div className="dashboard-container student-dashboard">
      {/* App Bar */}
      <nav className="navbar navbar-expand-lg navbar-light bg-white fixed-top">
        <div className="container-fluid">
          <span className="navbar-brand d-flex align-items-center">
            <img src={nitLogo} alt="NIT Logo" style={{ width: 40, height: 40, marginRight: 8 }} />
            <span>FYPMS - Student Portal</span>
          </span>
          <div className="dropdown ms-auto">
            <button
              className="btn btn-outline-dark dropdown-toggle"
              type="button"
              id="userMenuButton"
              onClick={() => setShowUserMenu((prev) => !prev)}
              aria-expanded={showUserMenu}
            >
              {user?.first_name || user?.username || 'Student'}
            </button>
            <ul className={`dropdown-menu dropdown-menu-end ${showUserMenu ? 'show' : ''}`} aria-labelledby="userMenuButton">
              <li>
                <button className="dropdown-item" onClick={handleLogout}>
                  Logout
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <div className="container mt-5" style={{ paddingTop: '20px' }}>
        {/* Card 1: Mentor Information */}
        <div className="card dashboard-card mb-4">
          <div className="card-body">
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: mentor ? 'pointer' : 'default'
            }} onClick={() => mentor && setMentorExpanded(!mentorExpanded)}>
              <div>
                <h5 className="card-title" style={{ marginBottom: 0 }}>
                  👨‍🏫 Mentor: {loading ? 'Loading...' : mentor ? `${mentor.first_name} ${mentor.last_name}` : 'Not assigned'}
                </h5>
              </div>
              {mentor && (
                <span style={{
                  fontSize: '1.5em',
                  color: '#007bff',
                  transform: mentorExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s ease'
                }}>
                  ▼
                </span>
              )}
            </div>

            {mentorExpanded && mentor && (
              <>
                <hr />
                <div>
                  <p><strong>Email:</strong> {mentor.email}</p>
                  <p><strong>Role:</strong> {mentor.role}</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Card 2: Project Information */}
        <div className="card dashboard-card">
          <div className="card-body">
            {/* Button Section */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
              {isEditing ? (
                <>
                  <button className="btn btn-success me-2" onClick={handleSave}>
                    💾 Save
                  </button>
                  <button className="btn btn-secondary" onClick={handleCancel}>
                    ✕ Cancel
                  </button>
                </>
              ) : (
                <button
                  className={`btn ${project ? 'btn-primary' : 'btn-success'}`}
                  onClick={handleEditClick}
                >
                  {project ? '✏️ Edit' : '➕ Add Project'}
                </button>
              )}
            </div>

            {/* Project Display / Edit Form */}
            {isEditing ? (
              // Edit Mode
              <form>
                <div className="mb-3">
                  <label className="form-label"><strong>Project Title</strong></label>
                  <input
                    type="text"
                    className="form-control"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Enter project title"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label"><strong>Project Type</strong></label>
                  <select
                    className="form-select"
                    name="project_type"
                    value={formData.project_type}
                    onChange={handleInputChange}
                  >
                    <option value="">Select a project type</option>
                    {projectTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label"><strong>Main Objective</strong></label>
                  <textarea
                    className="form-control"
                    name="main_objective"
                    value={formData.main_objective}
                    onChange={handleInputChange}
                    rows="2"
                    placeholder="Enter main objective"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label"><strong>Specific Objectives</strong></label>
                  <textarea
                    className="form-control"
                    name="specific_objectives"
                    value={formData.specific_objectives}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Enter objectives separated by -- (double hyphen)&#10;Example: To implement data.--To integrate dataset.--To do so and so."
                  />
                  <small className="text-muted">Separate each objective with -- (double hyphen)</small>
                </div>

                <div className="mb-3">
                  <label className="form-label"><strong>Project Description</strong></label>
                  <textarea
                    className="form-control"
                    name="project_description"
                    value={formData.project_description}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Enter project description"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label"><strong>Implementation Details</strong></label>
                  <textarea
                    className="form-control"
                    name="implementation_details"
                    value={formData.implementation_details}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Enter implementation details"
                  />
                </div>
              </form>
            ) : project ? (
              // Display Mode - Project Exists
              <div>
                <div className="mb-3">
                  <h5><strong>📌 {project.title}</strong></h5>
                </div>

                <div className="mb-2">
                  <label className="form-label"><strong>Project Type:</strong></label>
                  <p>{project.project_type || 'Not specified'}</p>
                </div>

                <div className="mb-2">
                  <label className="form-label"><strong>Main Objective:</strong></label>
                  <p>{project.main_objective || 'Not specified'}</p>
                </div>

                <div className="mb-2">
                  <label className="form-label"><strong>Specific Objectives:</strong></label>
                  {project.specific_objectives && project.specific_objectives.length > 0 ? (
                    <ul>
                      {project.specific_objectives.map((obj, idx) => (
                        <li key={idx}>{obj}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>Not specified</p>
                  )}
                </div>

                <div className="mb-2">
                  <label className="form-label"><strong>Project Description:</strong></label>
                  <p>{project.project_description || 'Not specified'}</p>
                </div>

                <div className="mb-2">
                  <label className="form-label"><strong>Implementation Details:</strong></label>
                  <p>{project.implementation_details || 'Not specified'}</p>
                </div>

                <div className="mb-2">
                  <label className="form-label"><strong>Status:</strong></label>
                  <p>
                    <span className="badge bg-info">{project.status}</span>
                  </p>
                </div>
              </div>
            ) : (
              // No Project - Display Message
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <h5>📋 No Project Submitted Yet</h5>
                <p>Click the "Add Project" button above to submit your first project.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;