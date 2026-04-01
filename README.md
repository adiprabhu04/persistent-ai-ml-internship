# Jot It

[![Live Demo](https://img.shields.io/badge/Live-Demo-5B6EF5?style=for-the-badge)](https://persistent-ai-ml-internship.onrender.com)
[![ASP.NET Core](https://img.shields.io/badge/ASP.NET_Core-8.0-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)](https://dotnet.microsoft.com/)
[![Python](https://img.shields.io/badge/Python-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React Native](https://img.shields.io/badge/React_Native-Expo-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Azure](https://img.shields.io/badge/Azure-Computer_Vision-0078D4?style=for-the-badge&logo=microsoftazure&logoColor=white)](https://azure.microsoft.com/en-us/products/ai-services/ai-vision)
[![Render](https://img.shields.io/badge/Deployed_on-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://render.com/)

An AI-powered note-taking app with handwriting OCR. Create text notes or draw directly on a canvas, and let Azure Computer Vision convert your handwriting into editable text with per-word confidence scores.

**Live:** [https://persistent-ai-ml-internship.onrender.com](https://persistent-ai-ml-internship.onrender.com)

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Screenshots](#screenshots)
- [Local Setup](#local-setup)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Deployment](#deployment)
- [Roadmap](#roadmap)
- [License](#license)

---

## Features

### Authentication
![](https://img.shields.io/badge/-C%23-239120?style=flat&logo=csharp&logoColor=white)
![](https://img.shields.io/badge/-PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white)

- Register and log in with a username and password
- JWT-based authentication with token expiry
- BCrypt password hashing server-side
- Protected API routes — all note operations require a valid token

### Note Management
![](https://img.shields.io/badge/-JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![](https://img.shields.io/badge/-C%23-239120?style=flat&logo=csharp&logoColor=white)

- Create, edit, and delete notes
- Four built-in categories: General, Personal, Work, Ideas
- Paginated note listing (`GET /notes?page=1&pageSize=50`)
- Real-time client-side search across note titles and content
- Original scanned images saved and displayed alongside OCR notes

### Handwriting OCR
![](https://img.shields.io/badge/-Python-3776AB?style=flat&logo=python&logoColor=white)
![](https://img.shields.io/badge/-Azure-0078D4?style=flat&logo=microsoftazure&logoColor=white)

- Draw directly on an HTML canvas with mouse or touch input
- Upload an existing image (JPG, PNG) for text extraction
- Azure Computer Vision processes the image and returns per-word results
- Each extracted word displays a confidence score
- Strike-through gesture on the canvas to erase individual words
- Word suggestions shown while typing in the note editor

### User Experience
![](https://img.shields.io/badge/-JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![](https://img.shields.io/badge/-Expo-000020?style=flat&logo=expo&logoColor=white)

- Dark and light theme toggle, persisted across sessions
- Progressive Web App — installable on desktop and mobile from the browser
- React Native mobile app (Expo SDK 54) for iOS and Android
- Responsive layout, mobile-first design

---

## Architecture

Jot It is composed of three independent services. In production each service runs as a separate Render web service.

```
Browser / Mobile App
        |
        | HTTPS
        v
+-------------------+        +-------------------+
|  ASP.NET Core 8   |  HTTP  |  Python FastAPI    |
|  Backend API      +------->+  OCR Service       |
|  (port 8080)      |        |  (port 8000)       |
+--------+----------+        +--------+-----------+
         |                            |
         | EF Core                    | Azure SDK
         v                            v
+-------------------+        +-------------------+
|   PostgreSQL      |        | Azure Computer    |
|   Database        |        | Vision API        |
+-------------------+        +-------------------+
```

### Backend — ASP.NET Core 8
![](https://img.shields.io/badge/-C%23-239120?style=flat&logo=csharp&logoColor=white)
![](https://img.shields.io/badge/-PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white)

Located at `/backend/NotesApi`. Implements a minimal API with the following responsibilities:

- User registration and login, issuing signed JWT tokens
- Full CRUD for notes, scoped to the authenticated user
- Forwards scan requests (multipart image) to the AI service and returns OCR results
- Serves the web frontend from `wwwroot/index.html`
- Database migrations via Entity Framework Core

### AI Service — Python FastAPI
![](https://img.shields.io/badge/-Python-3776AB?style=flat&logo=python&logoColor=white)
![](https://img.shields.io/badge/-Azure-0078D4?style=flat&logo=microsoftazure&logoColor=white)

Located at `/ai-service`. A lightweight FastAPI application with a single `/scan` endpoint:

- Accepts a multipart image upload
- Sends the image to Azure Computer Vision using the Read API
- Parses the response and returns a list of words with confidence scores
- Containerised with Docker for consistent deployment

### Mobile App — React Native / Expo
![](https://img.shields.io/badge/-Expo-000020?style=flat&logo=expo&logoColor=white)

Located at `/mobile`. Built with Expo SDK 54:

- Consumes the same backend REST API as the web frontend
- Screens for note list, note editor, and OCR scanner
- EAS Build configuration for producing standalone iOS and Android binaries

### Web Frontend — Vanilla JavaScript
![](https://img.shields.io/badge/-JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)

Located at `backend/NotesApi/wwwroot/index.html`. A single-file Progressive Web App:

- No JavaScript framework or build step required
- Service worker for offline caching of static assets
- Canvas-based drawing surface for handwriting input

---

## Screenshots

> Screenshots will be added after the live deployment is fully stable.
> 
> Planned captures: note list view, note editor, OCR canvas drawing, OCR results with confidence chips, dark theme, mobile app (React Native).

---

## Local Setup

### Prerequisites

| Tool | Version |
|------|---------|
| .NET SDK | 8.0+ |
| Python | 3.10+ |
| PostgreSQL | 14+ |
| Node.js | 18+ |
| Azure Computer Vision resource | any tier |

### Backend
![](https://img.shields.io/badge/-C%23-239120?style=flat&logo=csharp&logoColor=white)

```bash
cd backend/NotesApi
dotnet run
```

The API and web frontend are served on `http://localhost:8080`.

Set the required environment variables before running (see [Environment Variables](#environment-variables)).

### AI Service
![](https://img.shields.io/badge/-Python-3776AB?style=flat&logo=python&logoColor=white)

```bash
cd ai-service
pip install -r requirements.txt
uvicorn main:app --reload
```

The OCR service runs on `http://localhost:8000`.

### Mobile App
![](https://img.shields.io/badge/-Expo-000020?style=flat&logo=expo&logoColor=white)

```bash
cd mobile
npm install
npx expo start
```

Scan the QR code with the Expo Go app, or press `i` / `a` to open an iOS or Android simulator.

---

## Environment Variables

### Backend (Render or local)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET_KEY` | Secret used to sign JWT tokens — minimum 32 characters |
| `AI_SERVICE_URL` | Base URL of the Python OCR service (e.g. `https://your-ai-service.onrender.com`) |
| `ALLOWED_ORIGINS` | Comma-separated list of allowed CORS origins |

### AI Service (Render or local)

| Variable | Description |
|----------|-------------|
| `AZURE_VISION_KEY` | Azure Computer Vision API key |
| `AZURE_VISION_ENDPOINT` | Azure Computer Vision endpoint URL (e.g. `https://your-resource.cognitiveservices.azure.com/`) |

---

## API Reference

All `/notes` endpoints require an `Authorization: Bearer <token>` header.

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/register` | Create a new account |
| `POST` | `/auth/login` | Sign in and receive a JWT |
| `GET` | `/auth/me` | Return the authenticated user's profile |

### Notes

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/notes?page=1&pageSize=50` | List notes (paginated) |
| `POST` | `/notes` | Create a note |
| `PUT` | `/notes/:id` | Update a note |
| `DELETE` | `/notes/:id` | Delete a note |
| `POST` | `/notes/scan` | Submit a handwriting image for OCR (multipart/form-data) |

---

## Deployment

Both the backend and AI service are deployed as free-tier web services on Render.
![](https://img.shields.io/badge/-Render-46E3B7?style=flat&logo=render&logoColor=white)
![](https://img.shields.io/badge/-Docker-2496ED?style=flat&logo=docker&logoColor=white)

### Render Setup

1. Fork or push this repository to GitHub.
2. In the Render dashboard, create a new **Web Service** for each of the two services:

**Backend**

| Setting | Value |
|---------|-------|
| Root directory | `backend/NotesApi` |
| Build command | `dotnet publish -c Release -o out` |
| Start command | `dotnet out/NotesApi.dll` |
| Environment | Set all backend environment variables listed above |

**AI Service**

| Setting | Value |
|---------|-------|
| Root directory | `ai-service` |
| Dockerfile | `ai-service/Dockerfile` |
| Environment | Set `AZURE_VISION_KEY` and `AZURE_VISION_ENDPOINT` |

3. After both services are live, set `AI_SERVICE_URL` in the backend service to the URL of the deployed AI service.
4. Set `ALLOWED_ORIGINS` in the backend to include the frontend URL (same domain as the backend on Render).

### Free Tier Note

Render free-tier services spin down after 15 minutes of inactivity. The first request after a cold start may take 30–60 seconds while the service wakes up. Subsequent requests are fast.

---

## Roadmap

| Feature | Status |
|---------|--------|
| User registration and JWT authentication | Done |
| Create, edit, delete notes | Done |
| Note categories (General, Personal, Work, Ideas) | Done |
| Real-time search | Done |
| Handwriting OCR via canvas drawing | Done |
| Handwriting OCR via image upload | Done |
| Per-word confidence scores | Done |
| Strike-through gesture to erase canvas words | Done |
| Word suggestions while typing | Done |
| Original scan image saved with note | Done |
| Dark / light theme | Done |
| PWA — installable from browser | Done |
| React Native mobile app (Expo) | Done |
| Azure Computer Vision integration | Done |
| Rich text editing (bold, italic, lists) | Planned |
| Note sharing via public link | Planned |
| Voice notes | Planned |
| Note templates | Planned |
| Reminders and push notifications | Planned |
| Note version history | Planned |
| Multi-language OCR support | Planned |
| Collaborative editing | Planned |

---

## License

This project was developed as part of an internship program. All rights reserved.

---

**Repository:** [https://github.com/adiprabhu04/persistent-ai-ml-internship](https://github.com/adiprabhu04/persistent-ai-ml-internship)
