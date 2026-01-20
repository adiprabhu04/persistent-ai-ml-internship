# System Architecture

## High-Level Flow
Mobile App → Backend API → Firebase  
Mobile App → Backend API → OCR Service

## Components
1. Frontend (React Native)
   - Screens: Login, Notes List, Note Editor, Tasks
   - Calls backend APIs for all data

2. Backend (ASP.NET Core Web API)
   - Authentication (JWT)
   - Notes CRUD APIs
   - Tasks CRUD APIs
   - OCR endpoint integration

3. Database (Firebase Firestore)
   - Users collection
   - Notes collection
   - Tasks collection

4. Machine Learning (OCR)
   - Pretrained handwriting-to-text model
   - Image input → text output
   - Integrated after core app is stable

## Security
- Password hashing
- JWT-based authentication
- HTTPS enforced
- Sensitive fields hidden from API responses
