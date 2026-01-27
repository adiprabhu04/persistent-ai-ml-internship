# Persistent Full-Stack Internship – Notes Application Backend

## Overview
This repository contains my four-month internship project at Persistent Systems.
The current focus is on building a clean, production-oriented backend API for a notes application, following real-world engineering practices.

The project is being developed incrementally, starting with a solid backend foundation before extending into frontend and machine learning integration.

---

## Internship Focus
- Backend API development using ASP.NET Core
- Clean architecture and maintainable code structure
- Database persistence and schema versioning
- Secure and scalable design practices
- Incremental development with clear milestones

---

## Current Project Scope (Backend – Completed So Far)
The backend currently provides:
- Health check endpoint
- Full CRUD functionality for notes
- Persistent storage using SQLite
- Entity Framework Core integration
- Database migrations for schema management
- Swagger/OpenAPI documentation for API testing

---

## Technology Stack (Current)
- Backend Framework: ASP.NET Core (Minimal APIs)
- ORM: Entity Framework Core
- Database: SQLite
- API Documentation: Swagger / OpenAPI
- Language: C# (.NET SDK)

---

## API Endpoints
| Method | Endpoint         | Description             |
|------|------------------|-------------------------|
| GET  | /health          | API health check        |
| GET  | /notes           | Retrieve all notes      |
| GET  | /notes/{id}      | Retrieve note by ID     |
| POST | /notes           | Create a new note       |
| PUT  | /notes/{id}      | Update an existing note |
| DELETE | /notes/{id}    | Delete a note           |

---

## Project Structure
backend/NotesApi
├── Data
│   └── NotesDbContext.cs
├── Models
│   ├── Note.cs
│   ├── CreateNoteRequest.cs
│   └── UpdateNoteRequest.cs
├── Migrations
├── Program.cs
├── NotesApi.csproj

---

## How to Run Locally
1. Navigate to the backend project:
   cd backend/NotesApi

2. Restore dependencies:
   dotnet restore

3. Apply database migrations:
   dotnet ef database update

4. Run the application:
   dotnet run

5. Open Swagger in the browser:
   http://localhost:5052/swagger

---

## Planned Enhancements
- Repository and service layers for cleaner architecture
- Input validation and centralized error handling
- Authentication and authorization (JWT-based)
- Frontend integration (React / React Native)
- Machine learning integration for handwriting-to-text OCR

---

## Development & Tracking
- Incremental and meaningful Git commits
- Clear commit messages reflecting actual progress
- Weekly mentor check-ins and milestone tracking
- Emphasis on clean code, modularity, and maintainability

---

## Notes
External resources such as official documentation, Stack Overflow, and AI-assisted tools (e.g., ChatGPT) are used responsibly to accelerate development while ensuring full understanding and original implementation.
