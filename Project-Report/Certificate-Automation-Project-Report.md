
# Certificate Automation System
## Internship Project Detailed Report

**Submitted by:** Pushkarjay Ajay  
**Contact:** pushkarjay.ajay1@gmail.com | +91-821014935  
**Internship Organization:** SURE Trust  
**Internship Duration:** May 2025 – July 2025  
**Report Date:** July 17, 2025

---

## Table of Contents
1. [Introduction](#introduction)
2. [Internship Context & Objectives](#internship-context--objectives)
3. [Project Overview](#project-overview)
4. [System Architecture](#system-architecture)
5. [Technology Stack](#technology-stack)
6. [Development Timeline & Git Activity](#development-timeline--git-activity)
7. [Key Features & Modules](#key-features--modules)
8. [Database & Google Integration](#database--google-integration)
9. [Security & Deployment](#security--deployment)
10. [Testing & Debugging](#testing--debugging)
11. [Challenges & Solutions](#challenges--solutions)
12. [Screenshots & Sample Outputs](#screenshots--sample-outputs)
13. [Conclusion & Learnings](#conclusion--learnings)
14. [Appendix: Full Git Activity Log](#appendix-full-git-activity-log)

---

## 1. Introduction
This report documents the design, development, and deployment of the Certificate Automation System, completed as part of my internship at SURE Trust. The project automates certificate generation, management, and verification for students, trainers, and trainees, leveraging Google Sheets as a database and modern web technologies for the frontend and backend.

## 2. Internship Context & Objectives
- **Internship Role:** Full Stack Developer Intern
- **Organization:** SURE Trust
- **Objective:** To build a robust, scalable, and secure certificate automation platform that meets real-world requirements and SRS compliance, while gaining hands-on experience in software engineering, cloud integration, and DevOps.

## 3. Project Overview
The Certificate Automation System is a full-stack web application that streamlines the process of issuing, storing, and verifying certificates. It supports:
- Automated certificate generation (PDF/IMG) with QR codes
- Google Forms/Sheets integration for data collection
- Admin dashboard for management and analytics
- Public verification portal for authenticity checks

## 4. System Architecture
**High-Level Components:**
- **Frontend:** React app (modern UI) and static HTML/CSS/JS fallback
- **Backend:** Node.js/Express REST API
- **Database:** Google Sheets (primary), legacy SQL/MongoDB schemas for reference
- **Google Integration:** Apps Script for Forms/Sheets automation
- **Scripts:** Utility scripts for migration, testing, and maintenance

**Architecture Diagram:**
```
User → [Frontend (React/Static)] → [Backend API] → [Google Sheets DB]
                                 ↘︎ [Certificate Generation]
                                 ↘︎ [Admin Dashboard]
```

## 5. Technology Stack
- **Frontend:** React, HTML5, CSS3, JavaScript, Styled Components
- **Backend:** Node.js, Express.js
- **Database:** Google Sheets API, PostgreSQL (legacy), MongoDB (legacy)
- **Other:** Google Apps Script, PDFKit, QRCode, Render.com (deployment)

## 6. Development Timeline & Git Activity
**Development Period:** May 2025 – July 2025

**Commit Activity:**
- Over 100 commits, tracking all major features, bug fixes, and migrations
- All work authored by Pushkarjay Ajay (see appendix for full log)

**Key Milestones (from git log):**
1. Initial system setup and database schema design
2. Google Sheets migration (removal of SQL dependencies)
3. PDF-only certificate generation implementation
4. Admin dashboard and verification APIs
5. Security, deployment, and documentation

**Step Debugging & Iterative Development:**
- Each commit represents a logical step: feature addition, bug fix, refactor, or documentation
- Frequent use of test scripts and debug logs (see `scripts/` and commit messages)

## 7. Key Features & Modules
### Certificate Generation
- PDF and image certificates with QR codes
- Template-based and production-ready generators

### Database Integration
- Google Sheets as the main data store
- Support for multiple user roles (student, trainer, trainee)

### Admin Dashboard
- Overview, batch management, template management
- Manual and automated certificate approval

### Verification System
- Public verification via reference number
- Search by name/email
- Statistics and analytics

### Security
- Service account key management
- Environment variable-based secrets
- Secure API endpoints

### Deployment
- Render.com configuration
- Automated build and environment setup scripts

## 8. Database & Google Integration
### Google Sheets as Database
- Three main sheets: Student, Trainer, Trainee
- Data collected via Google Forms, processed by Apps Script, and stored in Sheets
- Backend APIs interact with Sheets for CRUD operations

### Google Apps Script
- Automates data transfer from Forms to Sheets and backend
- Handles field mapping, validation, and error logging

### Database Schema
- See `Database/README.md` for detailed schema and setup instructions

## 9. Security & Deployment
### Security Measures
- Service account credentials never committed to version control
- API keys and URLs managed via environment variables
- HTTPS enforced for all endpoints
- Regular audits and best practices followed (see `Google/SECURITY.md`)

### Deployment
- Hosted on Render.com (free plan)
- Automated build scripts for backend and frontend
- Environment variables configured for production

## 10. Testing & Debugging
- Comprehensive test scripts in `scripts/` directory
- Manual and automated tests for certificate generation, verification, and database connectivity
- Debug logs and error handling in all major modules
- Step-by-step troubleshooting guides (see `Google/TROUBLESHOOTING.md`)

## 11. Challenges & Solutions
- **Google Sheets API Quotas:** Implemented batch processing and error retries
- **Field Mapping Issues:** Created flexible mapping and validation logic
- **Deployment Errors:** Used debug logs and health endpoints for rapid diagnosis
- **Security:** Strict credential management and regular audits

## 12. Screenshots & Sample Outputs
*(Attach screenshots of admin dashboard, certificate samples, verification portal, and Google Sheets integration here in the final PDF submission)*

## 13. Conclusion & Learnings
This internship project provided hands-on experience in:
- Full-stack web development
- Cloud database integration (Google Sheets)
- Secure API design and deployment
- Real-world debugging, testing, and documentation

The Certificate Automation System is now production-ready and fully SRS-compliant, serving SURE Trust’s needs for digital certificate management.

## 14. Appendix: Full Git Activity Log
See attached `git_activity_report.txt` for the complete commit history, including file-level changes, debugging steps, and migration details.

---

*This report was prepared and submitted by Pushkarjay Ajay as part of the SURE Trust internship, July 2025.*
