# FYPMS - TODO List

## ✅ Phase 1: Core Features (COMPLETED)
- [x] Database schema design (PostgreSQL with pgvector support)
- [x] Django models creation (Project, UserProfile, Appointment, DuplicateFlag)
- [x] REST API endpoints (CRUD operations for all models)
- [x] Authentication setup (JWT-based login)
- [x] Admin panel configuration (Django admin interface)
- [x] Basic React frontend (Login, Dashboards for Student/Mentor/Admin)
- [x] Project structure and dependencies setup

---

## 🔄 Phase 2: Duplicate Detection & Intelligence (IN PROGRESS)
- [ ] **Implement Embedding Generation**
  - [ ] Create `projects/utils.py` with embedding generation functions
  - [ ] Integrate sentence-transformers for project embeddings
  - [ ] Generate embeddings on project creation/update (signals)
  - [ ] Store embeddings in pgvector columns
  - [ ] Create management command for batch embedding generation
  - [ ] Add embedding generation to project save/update

- [ ] **Implement Duplicate Detection Algorithm**
  - [ ] Create `projects/services.py` with similarity detection logic
  - [ ] Semantic similarity search using embeddings (cosine distance)
  - [ ] Full-text search using PostgreSQL indexes and pg_trgm
  - [ ] Hybrid scoring (combine semantic + lexical similarity)
  - [ ] Configurable similarity threshold (admin setting)
  - [ ] Auto-flag duplicates above threshold
  - [ ] Batch duplicate detection job (management command)

- [ ] **Duplicate Handling API Endpoints**
  - [ ] Manual duplicate check endpoint for single project
  - [ ] Bulk duplicate detection endpoint
  - [ ] Mark duplicates as reviewed API
  - [ ] Merge duplicate projects (optional advanced feature)

---

## 🔄 Phase 3: Search & Filtering (PARTIALLY DONE)
- [x] **Basic Project Filtering** (API supports basic filtering)
  - [ ] Enhanced filter by year, status, department
  - [ ] Filter by has_duplicates flag
  - [ ] Pagination for large result sets

- [ ] **Full-Text Search**
  - [ ] Search projects by title (PostgreSQL full-text search)
  - [ ] Search projects by objectives
  - [ ] Search projects by implementation details
  - [ ] Search across all text fields with ranking

- [ ] **Appointment Filtering**
  - [ ] Filter by status (proposed, confirmed, completed, cancelled)
  - [ ] Filter by date range
  - [ ] Calendar integration

---

## 🔄 Phase 4: Frontend Enhancements (IN PROGRESS)
- [x] **Basic Authentication** (Login page and context)
- [x] **Dashboard Layouts** (Student, Mentor, Admin dashboards exist)
- [ ] **Project Management UI**
  - [ ] Project submission form
  - [ ] Project listing with filters
  - [ ] Project detail view
- [ ] **Duplicate Management UI**
  - [ ] Duplicate flags display
  - [ ] Manual duplicate review interface
  - [ ] Similarity score visualization
- [ ] **Appointment Scheduling UI**
  - [ ] Calendar view for appointments
  - [ ] Appointment booking form
  - [ ] Status management

---

## 🔄 Phase 5: Admin Features & Configuration
- [ ] **Admin Dashboard Enhancements**
  - [ ] Analytics and statistics
  - [ ] System configuration (similarity thresholds)
  - [ ] Bulk operations
- [ ] **Mentor Assignment Logic**
  - [ ] Auto-assign mentors based on department/load
  - [ ] Manual mentor reassignment
- [ ] **Reporting & Analytics**
  - [ ] Project completion rates
  - [ ] Duplicate detection statistics
  - [ ] Appointment success rates

---

## 🔄 Phase 6: Testing & Deployment
- [ ] **Unit Tests**
  - [ ] Model tests
  - [ ] API endpoint tests
  - [ ] Duplicate detection algorithm tests
- [ ] **Integration Tests**
  - [ ] End-to-end workflows
  - [ ] Frontend-backend integration
- [ ] **Deployment Setup**
  - [ ] Docker configuration
  - [ ] Production settings
  - [ ] Static file serving
  - [ ] Database migration scripts
  - [ ] Filter by mentor/student

---

## Phase 4: Mentor Assignment Logic
- [ ] **Automated Mentor Assignment**
  - [ ] Load balancing: assign to mentor with fewest students
  - [ ] Load balancing considering max_students limit
  - [ ] Assignment based on department/course
  - [ ] Manual override capability for admins

- [ ] **Mentor Assignment API**
  - [ ] Auto-assign endpoint
  - [ ] Manual assign endpoint
  - [ ] Reassign endpoint
  - [ ] Get available mentors endpoint

- [ ] **Mentor Availability**
  - [ ] Track mentor workload
  - [ ] Display mentor availability
  - [ ] Recommendations for student-mentor matching

---

## Phase 5: Notifications & Emails
- [ ] **Email Configuration**
  - [ ] Setup Django email backend (SMTP)
  - [ ] Create email templates for different events
  - [ ] Implement email sending utilities

- [ ] **Appointment Notifications**
  - [ ] Send confirmation email on appointment creation
  - [ ] Send reminder emails (24h, 1h before)
  - [ ] Send completion confirmation after appointment

- [ ] **Project Notifications**
  - [ ] Notify on duplicate detection
  - [ ] Notify on project approval/rejection
  - [ ] Notify mentor on new project assignment

- [ ] **Celery/Task Queue Setup** (optional)
  - [ ] Setup Celery + Redis for async tasks
  - [ ] Convert email sending to background tasks
  - [ ] Schedule periodic duplicate detection

---

## Phase 6: Frontend UI (React/Vue)
- [ ] **Project Management Dashboard**
  - [ ] List projects with filtering
  - [ ] Submit new project form
  - [ ] View project details
  - [ ] Search projects

- [ ] **Duplicate Detection UI**
  - [ ] View flagged duplicates
  - [ ] Mark as reviewed
  - [ ] Similarity score visualization

- [ ] **Appointment Calendar**
  - [ ] Calendar view of appointments
  - [ ] Schedule new appointment
  - [ ] Confirm/cancel appointments
  - [ ] Appointment details view

- [ ] **User Dashboard**
  - [ ] Personal project list
  - [ ] Upcoming appointments
  - [ ] Quick stats (total projects, pending reviews, etc.)

- [ ] **Admin Dashboard**
  - [ ] System statistics
  - [ ] User management
  - [ ] Configuration settings
  - [ ] Bulk operations

---

## Phase 7: Production Deployment
- [ ] **Environment Configuration**
  - [ ] Create .env.example file
  - [ ] Setup environment variables
  - [ ] Debug=False for production
  - [ ] SECRET_KEY rotation

- [ ] **Database Optimization**
  - [ ] Create database indexes for queries
  - [ ] Query optimization
  - [ ] Connection pooling setup

- [ ] **Security**
  - [ ] CSRF protection
  - [ ] CORS configuration for production domain
  - [ ] Rate limiting on API
  - [ ] Input validation & sanitization

- [ ] **Deployment**
  - [ ] Heroku/AWS/DigitalOcean setup
  - [ ] Gunicorn + Nginx configuration
  - [ ] SSL/TLS certificates
  - [ ] CI/CD pipeline (GitHub Actions)
  - [ ] Database migrations in production

- [ ] **Monitoring & Logging**
  - [ ] Setup error logging (Sentry)
  - [ ] Application performance monitoring
  - [ ] Log aggregation

---

## Phase 8: Testing & Documentation
- [ ] **Unit Tests**
  - [ ] Model tests
  - [ ] Serializer tests
  - [ ] View/API endpoint tests

- [ ] **Integration Tests**
  - [ ] End-to-end API workflows
  - [ ] Duplicate detection tests
  - [ ] Authentication tests

- [ ] **Documentation**
  - [ ] API documentation (Swagger/OpenAPI)
  - [ ] User guide
  - [ ] Developer setup guide
  - [ ] Deployment guide

---

## Notes
- Duplicate detection critical for project success
- Consider async task processing for embeddings
- Frontend framework: React recommended for flexibility
- Database backups critical for production
- Monitor performance as data grows
