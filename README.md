# Persistent Full-Stack Internship (ML-Enabled Notes App)

## Overview
This repository contains my four-month internship project at Persistent Systems, focused on building a **secure, production-oriented mobile notes application** with an **integrated machine learning feature**.

The project emphasizes **end-to-end product development**, where machine learning is used as a core feature within a real-world system rather than as a standalone analytical model.

---

## Internship Focus
The internship is centered around:
- Full-stack application development
- Secure backend API design
- Integration of machine learning into a real product
- Reliability, quality, and maintainability
- Building a demo-ready, deployable application

---

## Project Description
The finalized project is a **mobile notes and task management application** with the following features:

- **User authentication** with secure password hashing and token-based authentication
- **CRUD functionality** for notes and tasks
- **Separate data models and storage** for notes and tasks
- **Handwriting-to-text conversion** using a machine learning (OCR) model
- Secure handling of sensitive data and enforced HTTPS communication

The machine learning component focuses on converting handwritten or doodled input into typed text, seamlessly integrated into the note-creation workflow.

---

## Technology Stack
- **Frontend:** React / React Native
- **Backend:** ASP.NET Core Web API
- **Database & Authentication:** Firebase (Firestore, Authentication)
- **Machine Learning:** Python-based OCR solution (pretrained, integrated via API)
- **Cloud Platform:** Firebase (free tier for development and demo)

---

## Project Timeline
- **Weeks 1–8:** Core notes application (backend APIs, frontend UI, integration)
- **Weeks 9–12:** Machine learning integration (handwriting-to-text OCR)
- **Weeks 13–15:** Testing, UX improvements, security hardening, and polish
- **Week 16:** Final demo and documentation

---

## Repository Structure
```
docs/          → Architecture notes, weekly plans, security decisions
frontend/      → Mobile application source code
backend/       → Backend API and authentication logic
ml/            → OCR research and ML integration
notebooks/     → Experiments and exploratory work
src/           → Shared utilities or legacy components (if applicable)
```

---

## Development & Tracking
- Incremental and meaningful Git commits
- Clear commit messages reflecting actual progress
- Weekly mentor check-ins and milestone tracking
- Emphasis on clean code, modularity, and secure coding practices

---

## Notes
External resources such as official documentation, Stack Overflow, and AI-assisted tools (e.g., ChatGPT) may be used for support, while ensuring **original understanding, logic, and implementation** throughout the project.
