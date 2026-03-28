-- ============================================================================
-- UNIVERSITY FINAL YEAR PROJECT MANAGEMENT SYSTEM - DATABASE SCHEMA
-- ============================================================================
-- This schema defines the core entities for the FYP Management System:
-- - Automated duplicate detection (using embeddings + full-text search)
-- - Mentor assignment and scheduling
-- - Appointment tracking with calendar support
--
-- Prerequisites: PostgreSQL with pgvector extension enabled
-- ============================================================================

-- Enable pgvector for embeddings
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;  -- For fuzzy text search

-- ============================================================================
-- CORE ENTITIES
-- ============================================================================

-- Mentors: Faculty members or senior staff overseeing projects
CREATE TABLE mentors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    department VARCHAR(255),
    is_admin BOOLEAN DEFAULT FALSE,
    max_students INT NOT NULL DEFAULT 5,  -- Load balancing
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Students: Undergraduate/postgraduate students submitting projects
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    registration_number VARCHAR(50) UNIQUE NOT NULL,
    course_id VARCHAR(100),
    mentor_id INT REFERENCES mentors(id) ON DELETE SET NULL,  -- Auto-assigned mentor
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Projects: FYP submissions (solo or group)
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    objectives TEXT NOT NULL,
    implementation_details TEXT,
    year INT NOT NULL,  -- Academic year (e.g., 2026)
    status VARCHAR(50) NOT NULL DEFAULT 'proposed',  -- proposed, approved, rejected, completed
    
    -- Embeddings for duplicate detection
    title_embedding vector(768),           -- SBERT embedding of title
    objectives_embedding vector(768),      -- SBERT embedding of objectives
    combined_embedding vector(768),        -- Combined embedding for similarity search
    
    -- Duplicate detection metadata
    last_similarity_check TIMESTAMP,
    is_flagged_duplicate BOOLEAN DEFAULT FALSE,
    duplicate_check_score FLOAT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_year CHECK (year >= 2020)
);

-- Project_Student: Links students to projects (supports solo + group projects)
CREATE TABLE project_student (
    id SERIAL PRIMARY KEY,
    project_id INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,  -- 'lead' or 'member'
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, student_id)
);

-- Appointments: Mentor-student scheduling with calendar integration
CREATE TABLE appointments (
    id SERIAL PRIMARY KEY,
    mentor_id INT NOT NULL REFERENCES mentors(id) ON DELETE CASCADE,
    student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    project_id INT REFERENCES projects(id) ON DELETE SET NULL,
    
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    
    status VARCHAR(50) NOT NULL DEFAULT 'proposed',  
        -- proposed, confirmed, completed, cancelled, reschedule_requested
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_time CHECK (end_time > start_time),
    CONSTRAINT no_overlap UNIQUE (mentor_id, start_time, end_time)
);

-- Duplicate Detection Results: Stores flagged projects and their matches
CREATE TABLE duplicate_flags (
    id SERIAL PRIMARY KEY,
    project_id INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    matched_project_id INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    
    similarity_score FLOAT NOT NULL,  -- Combined TF-IDF + SBERT score
    tfidf_score FLOAT,                -- Lexical similarity component
    sbert_score FLOAT,                -- Semantic similarity component
    levenshtein_distance INT,         -- Edit distance for typos
    
    admin_action VARCHAR(50),         -- 'approved', 'rejected', 'appealed'
    admin_notes TEXT,
    reviewed_by INT REFERENCES mentors(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Mentor Assignment History: Tracks auto and manual assignments
CREATE TABLE mentor_assignments (
    id SERIAL PRIMARY KEY,
    project_id INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    mentor_id INT NOT NULL REFERENCES mentors(id) ON DELETE SET NULL,
    
    assignment_type VARCHAR(50) NOT NULL,  -- 'auto' or 'manual'
    topic_similarity_score FLOAT,          -- If auto-assigned
    student_preference INT DEFAULT 0,      -- Preference rank (1=first choice)
    
    assigned_by INT REFERENCES mentors(id) ON DELETE SET NULL,  -- Admin who did manual override
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admin Settings: Configurable thresholds and parameters
CREATE TABLE admin_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value VARCHAR(255),
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Full-text search indexes for duplicate detection
CREATE INDEX idx_projects_title_fts ON projects USING GIN(to_tsvector('english', title));
CREATE INDEX idx_projects_objectives_fts ON projects USING GIN(to_tsvector('english', objectives));

-- Vector similarity indexes for embedding-based search
CREATE INDEX idx_projects_title_embedding ON projects USING ivfflat(title_embedding vector_cosine_ops) WITH (lists=100);
CREATE INDEX idx_projects_objectives_embedding ON projects USING ivfflat(objectives_embedding vector_cosine_ops) WITH (lists=100);
CREATE INDEX idx_projects_combined_embedding ON projects USING ivfflat(combined_embedding vector_cosine_ops) WITH (lists=100);

-- Performance indexes for common queries
CREATE INDEX idx_projects_year_status ON projects(year, status);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX idx_students_mentor_id ON students(mentor_id);
CREATE INDEX idx_appointments_mentor_student ON appointments(mentor_id, student_id);
CREATE INDEX idx_appointments_status_time ON appointments(status, start_time);
CREATE INDEX idx_project_student_project_id ON project_student(project_id);
CREATE INDEX idx_project_student_student_id ON project_student(student_id);
CREATE INDEX idx_duplicate_flags_project_id ON duplicate_flags(project_id);
CREATE INDEX idx_duplicate_flags_score ON duplicate_flags(similarity_score DESC);

-- Partial indexes for recently active records (query optimization)
CREATE INDEX idx_projects_recent ON projects(created_at) WHERE year >= (EXTRACT(YEAR FROM CURRENT_DATE) - 3);
CREATE INDEX idx_appointments_active ON appointments(start_time) WHERE status IN ('proposed', 'confirmed', 'reschedule_requested');

-- ============================================================================
-- MATERIALIZED VIEWS FOR ANALYTICS & ADMIN DASHBOARD
-- ============================================================================

-- View for duplicate detection statistics
CREATE MATERIALIZED VIEW mv_duplicate_stats AS
SELECT 
    year,
    COUNT(DISTINCT df.project_id) as flagged_projects,
    COUNT(*) as total_matches,
    AVG(df.similarity_score) as avg_similarity,
    MAX(df.similarity_score) as max_similarity,
    COUNT(CASE WHEN df.admin_action = 'approved' THEN 1 END) as confirmed_duplicates,
    COUNT(CASE WHEN df.admin_action = 'appealed' THEN 1 END) as appeals
FROM duplicate_flags df
JOIN projects p ON df.project_id = p.id
GROUP BY p.year;

-- View for mentor workload
CREATE MATERIALIZED VIEW mv_mentor_workload AS
SELECT 
    m.id,
    m.name,
    COUNT(DISTINCT s.id) as assigned_students,
    COUNT(DISTINCT a.id) as total_appointments,
    COUNT(CASE WHEN a.status = 'confirmed' THEN 1 END) as confirmed_appointments,
    m.max_students as max_capacity,
    ROUND(100.0 * COUNT(DISTINCT s.id) / m.max_students, 2) as utilization_percent
FROM mentors m
LEFT JOIN students s ON m.id = s.mentor_id
LEFT JOIN appointments a ON m.id = a.mentor_id
GROUP BY m.id, m.name, m.max_students;

-- ============================================================================
-- SAMPLE ADMIN SETTINGS (populate as needed)
-- ============================================================================

INSERT INTO admin_settings (setting_key, setting_value, description) VALUES
    ('DUPLICATE_SEARCH_YEARS_BACK', '3', 'How many years back to search for duplicates'),
    ('DUPLICATE_SIMILARITY_THRESHOLD', '0.6', 'Threshold score (0-1) to flag for admin review'),
    ('DUPLICATE_AUTO_FLAG_THRESHOLD', '0.8', 'Threshold score to auto-flag as duplicate'),
    ('DUPLICATE_ALGORITHM', 'HYBRID', 'Algorithm: TFIDF, EMBEDDING, or HYBRID'),
    ('MENTOR_MAX_LOAD_DEFAULT', '5', 'Default max students per mentor'),
    ('APPOINTMENT_ADVANCE_NOTICE_DAYS', '5', 'Min days to schedule appointment before review'),
    ('EMBEDDING_MODEL', 'sentence-transformers/all-MiniLM-L6-v2', 'SBERT model for embeddings')
ON CONFLICT (setting_key) DO NOTHING;

-- ============================================================================
-- TRIGGERS FOR DATA INTEGRITY & AUTOMATION
-- ============================================================================

-- Trigger: Update project.updated_at on changes
CREATE OR REPLACE FUNCTION update_project_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_project_timestamp
BEFORE UPDATE ON projects
FOR EACH ROW
EXECUTE FUNCTION update_project_timestamp();

-- Trigger: Update mentor.updated_at on changes
CREATE TRIGGER trigger_update_mentor_timestamp
BEFORE UPDATE ON mentors
FOR EACH ROW
EXECUTE FUNCTION update_project_timestamp();

-- Trigger: Update student.updated_at on changes
CREATE TRIGGER trigger_update_student_timestamp
BEFORE UPDATE ON students
FOR EACH ROW
EXECUTE FUNCTION update_project_timestamp();

-- Trigger: Prevent overlapping appointments for the same mentor
CREATE OR REPLACE FUNCTION check_appointment_overlap()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM appointments 
        WHERE mentor_id = NEW.mentor_id
        AND id != NEW.id
        AND status IN ('proposed', 'confirmed')
        AND (NEW.start_time, NEW.end_time) OVERLAPS (start_time, end_time)
    ) THEN
        RAISE EXCEPTION 'Mentor has overlapping appointment';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_appointment_overlap
BEFORE INSERT OR UPDATE ON appointments
FOR EACH ROW
EXECUTE FUNCTION check_appointment_overlap();

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
