# UNIVERSITY FINAL YEAR PROJECT MANAGEMENT SYSTEM

**TL;DR:** Automates duplicate-checking and mentor assignment for final-year projects using hybrid similarity detection (embeddings + full-text search) and configurable admin controls.

## Quick Links
- [Quick Start](#quick-start) — Get running in 5 min
- [Key Features](#key-features) — What this system does
- [Architecture](#architecture--tech-stack) — Tech stack
- [API Examples](#api-examples) — Sample requests/responses
- [Admin Guide](#admin-guide) — Configuration & tuning
- [Contributing](#contributing) — Development guidelines
- [Design Docs](#further-reading) — Deep dives (separate files)

## Quick Start

**Prerequisites:** Python 3.8+, PostgreSQL with pgvector and pg_trgm extensions, pip/virtualenv

```bash
python -m venv venv
venv\Scripts\activate               # Windows
# source venv/bin/activate          # Linux/macOS

pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver          # http://localhost:8000
```

**Test the API:**
```bash
curl -X POST http://localhost:8000/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "title": "AI-powered Chat Bot",
    "objectives": "Implement NLP-based chatbot using transformer models.",
    "student_name": "John Doe"
  }'
```

**Expected Response:**
```json
{
  "id": 1,
  "title": "AI-powered Chat Bot",
  "objectives": "Implement NLP-based chatbot using transformer models.",
  "status": "proposed",
  "duplicates": [],
  "mentor_assignment": null
}
```

## Key Features

- **Duplicate Detection:** Configurable similarity checks across project titles, objectives, and implementation details.
- **Hybrid Algorithm:** Combines sentence embeddings (semantic), full-text search (lexical), and Levenshtein distance (typos).
- **Configurable Scope:** Search current year or last N years; tune similarity thresholds (0.6–0.8 flags for review, ≥0.8 auto-flags).
- **Automated Mentor Assignment:** Respects student preferences, balances mentor load, and allows manual override.
- **Admin Dashboard:** Manage settings, review flagged duplicates, and track mentor availability.
- **Mentee Notifications & Calendar:** Built-in appointment scheduling with reminder notifications.

## Architecture & Tech Stack

| Component | Technology |
|-----------|-------------|
| **Frontend** | Bootstrap (HTML/CSS/JS) |
| **Backend** | Django + DRF (REST API) |
| **Database** | PostgreSQL + pgvector extension |
| **Embeddings** | Sentence-BERT (SBERT) for semantic similarity |
| **Full-text Search** | PostgreSQL GIN indexes (TF-IDF style) |
| **Vectorization** | TF-IDF + SBERT + Levenshtein (hybrid) |

## Data Model

### Core Entities

| Entity | Key Fields | Notes |
|--------|-----------|-------|
| **Student** | id, name, email, reg_no, course_id, mentor_id, created_at | Foreign key to mentor |
| **Mentor** | id, name, email, created_at | Can be admin; manages multiple students |
| **Project** | id, title, objectives, year, status, created_at, *_embedding (VECTOR), last_similarity_check | Status: proposed, approved, rejected, completed |
| **Project_Student** | id, project_id, student_id, role, joined_at | Links students to group projects; role: lead/member |
| **Appointment** | id, mentor_id, student_id, start_time, end_time, status, notes, created_at | Status: proposed, confirmed, completed, cancelled, reschedule_requested |

### Indexes for Performance

- **Full-text GIN indexes** on `title` and `objectives` for lexical search.
- **IVFFlat vector indexes** on `*_embedding` columns for fast approximate nearest-neighbor search.
- **Partial indexes** on recent/active projects (year >= current_year - 3).
- **Composite indexes** on (course_id, mentor_id), (project_id, role) for common queries.

## Duplicate Detection Design

Goals: detect similar/duplicated project titles, objectives, or implementation descriptions with configurable sensitivity and look-back period.

**Core pipeline (recommended):**

- Preprocessing: normalize case, remove punctuation, stopwords, and perform light stemming.

**Vectorization options (configurable):**

- TF-IDF vectors + cosine similarity (fast, explainable).
- Sentence embeddings (e.g., SBERT) + cosine similarity (better semantic matching).
- Character-level Levenshtein for short titles (catch near-duplicates/typos).

Similarity scoring: combine measures (weighted) to produce a single similarity score.

Thresholding: expose a configurable threshold (e.g., 0.75) to classify duplicates; admin can tune per corpus and year window.

History scope: query projects from current year or last N years depending on admin setting.

### Similarity Score Classification

After computing the final similarity score (combined / weighted from embedding, lexical, and edit-distance signals), the system classifies results as follows:

| Similarity Score | System Action |
|------------------|---------------|
| < 0.6 | Auto-approve (no duplicate action required) |
| 0.6 – 0.8 | Flag for admin review (present matches and explainability info) |
| ≥ 0.8 | Auto-flag as duplicate (prevent submission or require student action) |

**Default Configuration:**
- `DUPLICATE_SIMILARITY_THRESHOLD = 0.6` (admin review threshold)
- `DUPLICATE_AUTO_FLAG_THRESHOLD = 0.8` (auto-flag threshold)

These ranges are configurable by the admin; the defaults above provide a balance between minimizing false positives (admins review medium scores) and catching high-confidence duplicates automatically.

### Recommended Pipeline (TF-IDF → SBERT → Decision)

For submissions the system will apply a two-stage pipeline by default:

- TF-IDF similarity (fast lexical filter): quickly retrieve top candidate projects that share lexical overlap or important tokens with the new submission. This stage is very fast and provides explainable token matches for admin review.
- SBERT similarity (semantic confirmation): compute or reuse precomputed SBERT embeddings for the submission and re-rank the TF-IDF candidates by cosine similarity to confirm semantic similarity and catch paraphrases.
- Decision + admin review: combine TF-IDF and SBERT signals (with optional Levenshtein/title guard) to compute the final similarity score and apply the classification rules (auto-approve / flag for review / auto-flag duplicate).

**Flow (visual):**

New project submitted ↓ Full-text search similarity (fast lexical filter) ↓ SBERT similarity (semantic confirmation) ↓ Decision + admin review

**Notes:**

- Full-text search stage reduces the number of expensive embedding comparisons and provides lexical evidence.
- SBERT stage improves recall for rephrased content and reduces false negatives.
- Weighting between full-text search and SBERT is configurable; tune on a labeled validation set.

**Performance & scaling:**

- **Precomputed embeddings**: SBERT vectors stored in database for instant similarity comparison
- **Vector indexes**: IVFFlat indexes enable sub-second nearest neighbor searches across thousands of projects
- **Full-text indexes**: GIN indexes provide fast lexical filtering before semantic analysis
- **Hybrid pipeline**: Combines fast TF-IDF pre-filtering with precise SBERT similarity
- **Batch processing**: Compare against multiple candidates simultaneously, not sequentially
- **ANN optimization**: Approximate nearest neighbor search reduces comparisons from O(n) to O(log n)
- **Materialized views**: Pre-aggregated statistics for dashboard performance
- **Automatic triggers**: Maintain embedding update timestamps
- **Table partitioning**: Ready for horizontal scaling when dataset grows large

### Database Maintenance & Monitoring

**Automated Features:**
- **Embedding update triggers**: Automatically timestamp when vectors are refreshed
- **Materialized view refresh**: `REFRESH MATERIALIZED VIEW mv_duplicate_stats;` (run daily)
- **Index maintenance**: Regular `REINDEX` operations for vector indexes

**Monitoring Queries:**
```sql
-- Check duplicate detection performance
SELECT * FROM mv_duplicate_stats;

-- Monitor index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch 
FROM pg_stat_user_indexes 
WHERE tablename = 'projects';

-- Vector index performance
SELECT * FROM pg_stat_user_indexes 
WHERE indexname LIKE '%embedding%';
```

**Scaling Strategies:**
- **Partition by year**: When projects > 100K, partition table by academic year
- **Archive old data**: Move projects older than 5 years to archive tables
- **Index optimization**: Monitor and adjust IVFFlat index parameters based on query patterns

### Database Query Optimization

**The Problem You Identified:**
Without proper indexing, duplicate detection would require fetching projects one-by-one:
```sql
-- INEFFICIENT: Sequential fetching (O(n) time)
FOR each existing_project IN SELECT * FROM projects LOOP
    similarity = compare(new_project, existing_project)  -- Slow!
END LOOP
```

**The Optimized Solution:**
```sql
-- EFFICIENT: Bulk vector similarity search (O(log n) time)
SELECT id, title, 
       1 - (combined_embedding <=> $new_project_embedding) as similarity_score
FROM projects 
WHERE year >= $check_years_back
ORDER BY combined_embedding <=> $new_project_embedding
LIMIT 50;  -- Top 50 candidates for detailed analysis

-- Plus fast text pre-filtering
SELECT id FROM projects 
WHERE to_tsvector('english', title || ' ' || objectives) @@ plainto_tsquery($search_terms)
LIMIT 100;  -- Quick lexical candidates
```

**Performance Comparison:**
- **Naive approach**: 10,000 projects × 100ms comparison = ~17 minutes
- **Optimized approach**: < 200ms for vector search + < 100ms for text search = ~300ms total

**Explainability:**

- Provide the administrator with the matched fields, similarity score, and top contributing tokens/phrases for each match.

### Potential Issues & Mitigations

While the hybrid duplicate detection pipeline is robust, here are potential challenges and mitigation strategies:

#### **1. Short Text Challenges**
- **Issue**: Very short titles/objectives may produce false positives due to limited context
- **Mitigation**: Apply stricter thresholds for short texts or require admin review

#### **2. Domain-Specific Terminology**
- **Issue**: Technical terms in computer science, engineering, etc. might be flagged as similar when they're standard
- **Mitigation**: Maintain domain-specific stopword lists + admin whitelist for common technical terms

#### **3. Multilingual or Mixed Content**
- **Issue**: Projects with code snippets, diagrams, mathematical formulas, or non-English content
- **Mitigation**: Focus detection on natural language descriptions + manual review for complex multimedia content

#### **4. Evolving Language & Trends**
- **Issue**: New terminology, emerging technologies, or trending topics might not be well-represented in training data
- **Mitigation**: Regular model updates with recent academic papers + admin feedback loop for continuous improvement

#### **5. Computational Resource Constraints**
- **Issue**: SBERT embeddings require significant compute for large datasets
- **Mitigation**: Use precomputation + ANN indexing (Faiss/Annoy) + fallback to TF-IDF-only mode when needed

#### **6. False Positives from Common Phrases**
- **Issue**: Generic academic phrases ("literature review", "methodology", "conclusion") trigger matches
- **Mitigation**: Enhanced preprocessing to filter common academic boilerplate + context-aware weighting

#### **7. Student Gaming Attempts**
- **Issue**: Deliberate attempts to circumvent detection through minimal rephrasing or synonym substitution
- **Mitigation**: Multi-signal approach (lexical + semantic + character-level) + admin review of suspicious patterns

#### **8. Performance Degradation Over Time**
- **Issue**: As dataset grows, similarity checks become slower
- **Mitigation**: Implement ANN indexing, database partitioning by year, and caching strategies

#### **Implementation Recommendations:**
- **Start Conservative**: Set higher thresholds initially, adjust based on false positive rates
- **A/B Testing**: Run parallel pipelines with different algorithms to compare effectiveness
- **Regular Audits**: Monthly review of flagged projects to identify systemic issues
- **User Training**: Educate students about academic integrity and plagiarism policies

## Algorithm Details

**Why SBERT (Sentence embeddings)?**
- Captures semantic meaning, not just word overlap.
- Trained to bring paraphrases close in vector space.
- Provides high-quality 768-dim vectors for efficient cosine similarity.

**Why Hybrid (SBERT + TF-IDF + Levenshtein)?**
- **SBERT**: Catches semantic equivalence and paraphrases.
- **TF-IDF**: Fast, explainable, provides lexical evidence for admin review.
- **Levenshtein**: Detects typos and small edits in short titles.
- Balances speed, accuracy, and transparency.

**How It Works**
1. Preprocess text (normalize, strip punctuation, tokenize).
2. Compute/store SBERT embeddings for title, objectives, and combined text.
3. Run full-text search to retrieve top ~50 lexically similar projects.
4. Re-rank candidates using vector similarity (cosine distance).
5. Combine TF-IDF and SBERT scores; apply threshold rules.
6. Surface flagged items to admin with evidence (matched tokens, score components).

**Storage & Scaling**
- ~11 KB per project (embeddings + metadata).
- 100K projects → ~1.15 GB total.
- Scales via vector indexes (IVFFlat), table partitioning by year, and ANN indexing.
- Typical duplicate check: < 300ms for retrieval + ranking.

**Fallback Modes (if compute-constrained)**
- **TF-IDF only**: Fast, explainable, no embeddings needed. Use for small corpora or low compute.
- **Levenshtein only**: Detects typos in titles; insufficient for semantic matching alone.

**Detecting Rephrases**
Embeddings map "AI-powered chatbot using transformers" and "Develop conversational bot with neural networks" to nearby vectors despite different wording. This semantic equivalence is automatically detected via cosine similarity. TF-IDF won't catch this—embeddings do.

## Mentor Assignment Design

**Auto-assignment strategy (recommended):**

- Compute topic similarity between project and mentor expertise tags or mentor-profile embeddings.
- Filter mentors by availability (current load < max_load).
- Respect student preference list when present — try to match preferences first.
- Apply load-balancing by selecting the mentor with highest similarity and lowest load.
- Allow manual override in admin UI; record overrides in MentorAssignment.type = 'manual'.

## APIs and Endpoints (suggested)

These are suggested REST endpoints for a backend service. Adjust to your chosen framework.

- `POST /api/projects` — create a project (store project + compute & store embeddings).
- `GET /api/projects/{id}/duplicates?years_back=3&threshold=0.75` — returns potential duplicates with scores.
- `POST /api/projects/check-duplicates` — realtime check for an input title/objectives.
- `POST /api/assignments/auto-assign` — auto-assign mentors for unassigned projects.
- `GET /api/mentors/{id}/students` — returns students assigned to that mentor.
- `GET /api/admin/settings` and `PUT /api/admin/settings` — admin settings (years_back, thresholds).

**Authentication & Authorization:**

- Protect admin APIs with role-based auth (JWT/OAuth). Student endpoints limited to their own data.

## Configuration

Key configurable parameters:

- `DUPLICATE_SEARCH_YEARS_BACK` (int, default: 3) — How many years back to search for duplicates
- `DUPLICATE_SIMILARITY_THRESHOLD` (float 0..1, default: 0.6) — Threshold to flag for admin review
- `DUPLICATE_AUTO_FLAG_THRESHOLD` (float 0..1, default: 0.8) — Threshold to auto-flag as duplicate
- `DUPLICATE_ALGORITHM` (enum: TFIDF|EMBEDDING|HYBRID, default: HYBRID) — Which algorithm to use
- `MENTOR_MAX_LOAD_DEFAULT` (int, default: 5) — Default max students per mentor
- `APPOINTMENT_ADVANCE_NOTICE_DAYS` (int, default: 5) — Min days to schedule appointment before review
- `EMBEDDING_MODEL` (string, default: sentence-transformers/all-MiniLM-L6-v2) — SBERT model for embeddings

Store these in environment variables or a secure settings file; never commit secrets to source control.

## Developer Setup & Run

**Prerequisites:**

- Python 3.8+
- PostgreSQL with pgvector extension
- pip and virtualenv

**Common commands:**

```bash
# from project root
python -m venv vee
vee\Scripts\activate  # Windows
# source vee/bin/activate  # Linux/Mac

pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

**Local dev tips:**

- Use a small seed dataset to test duplicate detection logic.
- Add environment variables for database connection and API keys.

## Admin Guide

**Tuning Duplicate Detection Thresholds**
- **Increase threshold** (0.75 → 0.85) to reduce false positives (fewer manual reviews).
- **Decrease threshold** (0.75 → 0.65) to catch more potential duplicates (more reviews).
- **Expand search window**: Set `DUPLICATE_SEARCH_YEARS_BACK=5` to check older projects.
- **Review flagged projects** monthly; mark confirmed false positives to refine thresholds.
- **A/B test**: Run TF-IDF vs. hybrid pipelines side-by-side to measure accuracy.

**Best Practices**
- Start with conservative thresholds; adjust based on false positive feedback.
- Educate students about academic integrity and detection policies.
- Monthly audits of flagged projects to identify systemic issues.
- Monitor mentor loads and manage assignments via the Dashboard.

## Mentor Availability & Appointment Calendar

**Features:**
- Mentors publish available time slots; students view and request appointments.
- Mentors approve/decline requests; students propose reschedules (requires mentor approval).
- System enforces deadlines (e.g., "meetings must be scheduled 5 days before review").
- In-app and optional email notifications for confirmations, reminders, and cancellations.
- Appointment history tracked for auditing and compliance.

**Data Model:**
Appointment entity: `id, mentor_id, student_id, start_time, end_time, status, notes, created_at, updated_at`.  
Status values: `proposed | confirmed | completed | cancelled | reschedule_requested`.

**Implementation Notes:**
- Use date/time slots or iCalendar format for calendar backend.
- Prevent overlapping appointments for the same mentor.
- Background jobs for reminder notifications and deadline enforcement.
- UI: calendar view (week/month), notification bell, student confirm/reschedule UX, mentor approval screens.

## Contributing & Extensibility

**Adding a New Duplicate Detection Algorithm:**
1. Create a module with `compute_embedding(text)` and `similarity(a, b)` interfaces.
2. Update config switch and database migration to compute/store embeddings for existing records.

**Adding Features:**
- Maintain API contract stability; document new endpoints.
- Update Bootstrap templates; follow Django style guide (`black`, `flake8`).

**Development Workflow:**
- Submit PRs with description, tests, and any migration scripts.
- Measure test coverage: preprocessing, scoring, mentor-assignment logic.
- Performance tests: measure duplicate check latency on realistic dataset sizes.

## Further Reading & Documentation

For deep dives on vector indexing, threshold calibration, scaling strategies, and data retention policies, see the project's `docs/` folder or contact the maintainer.

## FAQ

**Q: Why precompute embeddings?**  
A: Precomputed embeddings enable sub-second lookup via vector indexes; computing per request is too slow for 10K+ projects.

**Q: Can I use TF-IDF only without embeddings?**  
A: Yes, set `DUPLICATE_ALGORITHM=TFIDF` in config. TF-IDF is lightweight but less effective at catching rephrases.

**Q: How often should I adjust thresholds?**  
A: Monthly; review flagged projects and adjust based on false positive/negative rates.

**Q: Can students dispute a duplicate flag?**  
A: Yes; implement an appeal workflow where students provide evidence and admins review.

## Contact & Maintainer

**Maintainer:** Miss Joyce Ringo  
**Contributing:** Open a PR with tests and migration scripts.  
**Questions:** See code comments and repository issues.

---

**This system helps ensure academic integrity and reduces faculty workload by automating duplicate detection and mentor assignment for final-year projects.**