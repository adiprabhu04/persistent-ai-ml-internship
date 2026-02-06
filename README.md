# Notely - AI-Powered Notes Application

A modern, full-stack notes application with AI-powered handwriting recognition (OCR). Built with ASP.NET Core backend, vanilla JavaScript frontend, and Python AI service.

## Live Demo

**Backend API**: https://persistent-ai-ml-internship.onrender.com

## Features

### Core Features
- User authentication (registration & login with JWT)
- Create, read, update, and delete notes
- Real-time search with highlighting
- Note categories (Personal, Work, Ideas, Archive)
- Grid and list view options
- Sort by newest, oldest, or title

### AI Features
- Handwriting-to-text OCR using EasyOCR
- Upload images of handwritten notes
- Automatic text extraction and note creation

### UI/UX Features
- Modern, responsive design
- Dark mode support
- Keyboard shortcuts
- Toast notifications
- Smooth animations and transitions
- Mobile-first approach

## Technology Stack

### Backend
- **Framework**: ASP.NET Core 8.0 (Minimal APIs)
- **Database**: PostgreSQL (Neon - cloud hosted)
- **ORM**: Entity Framework Core
- **Authentication**: JWT (JSON Web Tokens)
- **Password Security**: BCrypt hashing
- **API Documentation**: Swagger/OpenAPI

### Frontend
- **Language**: Vanilla JavaScript (ES6+)
- **Styling**: Modern CSS with CSS Variables
- **Features**: Single Page Application (SPA)
- **No external dependencies**

### AI Service
- **Framework**: FastAPI (Python)
- **OCR Engine**: EasyOCR
- **Server**: Uvicorn ASGI

## Project Structure

```
persistent-ai-ml-internship/
├── backend/NotesApi/           # ASP.NET Core API
│   ├── Data/                   # Database context
│   ├── Helpers/                # Auth utilities
│   ├── Models/                 # Entity models & DTOs
│   ├── Migrations/             # EF Core migrations
│   ├── wwwroot/                # Frontend SPA
│   │   └── index.html          # Single-page frontend
│   └── Program.cs              # API endpoints
├── ai-service/                 # Python OCR service
│   ├── main.py                 # FastAPI application
│   ├── Dockerfile              # Container config
│   └── requirements.txt        # Python dependencies
├── docs/                       # Documentation
└── Dockerfile                  # Main backend container
```

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Create new account |
| POST | `/auth/login` | Sign in and get JWT |

### Notes (requires authentication)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/notes` | Get all notes (paginated) |
| GET | `/notes/{id}` | Get note by ID |
| POST | `/notes` | Create new note |
| POST | `/notes/upload` | Upload image for OCR |
| PUT | `/notes/{id}` | Update note |
| DELETE | `/notes/{id}` | Delete note |

### System
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |

### Query Parameters for GET /notes
- `page` - Page number (default: 1)
- `pageSize` - Items per page (default: 10, max: 50)
- `search` - Search term for title/content

## Environment Variables

### Backend (Required)
```
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
JWT_SECRET_KEY=your-secret-key-minimum-32-characters
AI_SERVICE_URL=https://your-ai-service.onrender.com/ocr
```

### Backend (Optional)
```
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
```

### AI Service
```
PORT=8080
```

## Local Development

### Prerequisites
- .NET 8.0 SDK
- Python 3.10+
- PostgreSQL (or use Neon cloud)

### Backend Setup

```bash
cd backend/NotesApi

# Set environment variables
export DATABASE_URL="your-connection-string"
export JWT_SECRET_KEY="your-32-char-secret-key"

# Restore and run
dotnet restore
dotnet ef database update
dotnet run
```

Open http://localhost:5052 for the app or http://localhost:5052/swagger for API docs.

### AI Service Setup

```bash
cd ai-service

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run service
uvicorn main:app --host 0.0.0.0 --port 8000
```

## Deployment

### Deploy to Render

#### Backend
1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set build command: `dotnet publish -c Release -o out`
4. Set start command: `dotnet out/NotesApi.dll`
5. Add environment variables (DATABASE_URL, JWT_SECRET_KEY, AI_SERVICE_URL)

#### AI Service
1. Create a new Web Service on Render
2. Connect the ai-service directory
3. Set as Docker deployment
4. The service will auto-start on port 8080

### Database (Neon PostgreSQL)
1. Create a free Neon account
2. Create a new project
3. Copy the connection string to DATABASE_URL

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + N` | Create new note |
| `Ctrl + K` | Focus search |
| `Ctrl + Shift + D` | Toggle dark mode |
| `Esc` | Close modals |
| `Ctrl + S` | Save note (in editor) |

## Security Features

- JWT-based authentication with 2-hour expiry
- BCrypt password hashing
- Input validation and sanitization
- File upload restrictions (10MB max, images only)
- CORS configuration for production
- No sensitive data in error messages

## Screenshots

### Light Mode
The application features a clean, modern interface with:
- Sidebar navigation with categories
- Grid/list view toggle
- Search with real-time filtering
- Note cards with hover actions

### Dark Mode
Full dark mode support with:
- Automatic system preference detection
- Manual toggle via header button
- Persistent preference storage

## Future Enhancements

- Note sharing with public links
- Export to PDF/Markdown
- Rich text editor with formatting
- Note templates
- Revision history
- Collaborative editing
- Mobile apps (React Native)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is part of a full-stack internship program at Persistent Systems.

## Acknowledgments

- EasyOCR for handwriting recognition
- Neon for PostgreSQL hosting
- Render for deployment platform
