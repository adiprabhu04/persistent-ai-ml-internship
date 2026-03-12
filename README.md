# Jot It ✍️

A modern, AI-powered note-taking Progressive Web App with handwriting recognition capabilities.

## 🌟 Features

### Core Functionality
- **Handwriting OCR**: Convert handwritten notes to text using Google Cloud Vision API
- **Canvas Drawing**: Draw and write with touch or mouse input
- **Image Upload**: Extract text from uploaded images
- **Rich Note Management**: Create, edit, delete, and organize notes
- **Smart Search**: Find notes quickly with instant search
- **Categories**: Organize notes into Personal, Work, Ideas, and custom categories

### AI & OCR
- Google Cloud Vision API for primary OCR (95%+ accuracy)
- Advanced image preprocessing (4x upscaling, noise reduction, edge sharpening)
- Word-level confidence scoring
- Interactive editable word chips (click to fix individual words)
- Tesseract fallback for offline capability

### User Experience
- **PWA**: Install on mobile and desktop as a native app
- **Dark/Light Themes**: Automatic and manual theme switching
- **Keyboard Shortcuts**: 20+ shortcuts for power users (Ctrl+K, Ctrl+N, J/K navigation, etc.)
- **Mobile Gestures**: Swipe to delete/edit, long-press menus, pull-to-refresh
- **Haptic Feedback**: Vibration feedback on mobile devices
- **Command Palette**: Quick access to all features (Ctrl+K)
- **Export**: Download notes as JSON

### Design
- Modern, clean interface with yellow accent (#FFD60A)
- True dark mode (#0F0F0F background)
- Smooth animations and transitions
- Responsive design (mobile-first)
- Professional SVG icons

## 🛠️ Tech Stack

### Frontend
- **Framework**: Vanilla JavaScript (no dependencies)
- **PWA**: Service Worker, Web App Manifest
- **Styling**: CSS Custom Properties, CSS Grid/Flexbox
- **Icons**: Inline SVG

### Backend
- **Framework**: ASP.NET Core 8
- **Database**: PostgreSQL (Neon)
- **Authentication**: JWT tokens with SHA-256 client-side hashing
- **API**: RESTful endpoints

### AI Service
- **Framework**: Python FastAPI
- **OCR**: Google Cloud Vision API (primary), Tesseract OCR (fallback)
- **Image Processing**: PIL, NumPy, SciPy
- **Preprocessing**: Adaptive thresholding, contrast enhancement, sharpening

### Deployment
- **Frontend & Backend**: Render (https://persistent-ai-ml-internship.onrender.com)
- **AI Service**: Render (https://notes-ai-service-wqgp.onrender.com)
- **Database**: Neon PostgreSQL

## 📦 Installation

### Prerequisites
- .NET 8 SDK
- Python 3.10+
- PostgreSQL
- Google Cloud Vision API credentials

### Backend Setup

1. Clone the repository:
```bash
git clone https://github.com/adiprabhu04/persistent-ai-ml-internship.git
cd persistent-ai-ml-internship
```

2. Configure environment variables:
```bash
export DATABASE_URL="your-postgresql-connection-string"
export JWT_SECRET_KEY="your-32-char-secret-key"
export AI_SERVICE_URL="https://your-ai-service.onrender.com"
```

3. Run migrations and start:
```bash
cd backend/NotesApi
dotnet ef database update
dotnet run
```

Backend runs on `http://localhost:8080`

### AI Service Setup

1. Install dependencies:
```bash
cd ai-service
pip install -r requirements.txt
```

2. Install Tesseract OCR:
```bash
# Ubuntu/Debian
sudo apt-get install tesseract-ocr

# macOS
brew install tesseract

# Windows — download from https://github.com/UB-Mannheim/tesseract/wiki
```

3. Set up Google Cloud Vision:
```bash
export GOOGLE_APPLICATION_CREDENTIALS="path/to/your-credentials.json"
```

4. Start the AI service:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Frontend

The frontend is served by the ASP.NET Core backend at `/wwwroot/index.html`. Access at `http://localhost:8080`.

## 🚀 Usage

### Desktop (Keyboard Shortcuts)

| Shortcut | Action |
|----------|--------|
| `Ctrl + K` | Open command palette |
| `Ctrl + N` | New note |
| `Ctrl + F` or `/` | Search notes |
| `Ctrl + S` | Save note |
| `Ctrl + ,` | Settings |
| `Ctrl + D` | Duplicate note |
| `Ctrl + Shift + C` | Copy note content |
| `Ctrl + Shift + D` | Toggle theme |
| `?` | Show keyboard shortcuts |
| `Esc` | Close modals |
| `1 – 4` | Switch categories |
| `J / K` | Navigate notes (vim-style) |
| `Enter` | Open selected note |
| `G G` | Scroll to top |
| `Shift + G` | Scroll to bottom |
| `Alt + R` | Recent notes |
| `Alt + H` | Home |

### Mobile (Touch Gestures)

| Gesture | Action |
|---------|--------|
| Swipe left | Delete note (with confirmation) |
| Swipe right | Edit note |
| Long press | Quick actions menu (edit, duplicate, delete) |
| Pull down | Refresh notes |
| Long press FAB | Choose note type (text / scan) |

### OCR Scanning

1. Click the scan icon in the bottom navigation or press `Ctrl+K` → Scan Handwriting
2. Choose **Draw** to write on the canvas, or **Upload** to select an image
3. Click **Scan**
4. Review extracted text — each word shows a confidence score
5. Click any word chip to edit it inline
6. Click **Save as Note**

## 🎨 Customization

### Themes
Toggle dark/light mode:
- Desktop: `Ctrl + Shift + D`
- Mobile: Settings → Theme

### Categories
Notes are colour-coded by tag:
- `#personal` — Cyan
- `#work` — Yellow
- `#ideas` — Purple
- No tag — Gray

## 📊 Project Structure

```
persistent-ai-ml-internship/
├── backend/
│   └── NotesApi/
│       ├── Models/          # Note, User models
│       ├── Data/            # DbContext, Migrations
│       ├── Helpers/         # JWT, password hashing
│       ├── wwwroot/         # Frontend (index.html, sw.js)
│       └── Program.cs       # API endpoints
├── ai-service/
│   ├── main.py              # FastAPI OCR service
│   ├── requirements.txt     # Python dependencies
│   └── Dockerfile           # Container configuration
├── docs/                    # Documentation
├── manifest.json            # PWA manifest
└── README.md
```

## 🔐 Security

- **Password Hashing**: SHA-256 client-side + BCrypt server-side
- **Authentication**: JWT tokens with expiry
- **HTTPS**: Enforced on production
- **CORS**: Configured for specific origins
- **Input Sanitisation**: Server-side validation on all inputs
- **XSS Prevention**: HTML-escaped output throughout the frontend

## 📋 API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Create account |
| POST | `/auth/login` | Sign in, returns JWT |
| GET | `/auth/me` | Get current user info |

### Notes (JWT required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/notes` | List notes (paginated) |
| POST | `/notes` | Create note |
| PUT | `/notes/{id}` | Update note |
| DELETE | `/notes/{id}` | Delete note |
| POST | `/notes/scan` | OCR scan (multipart image) |

### System
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |

## 📈 Performance

- **Frontend**: Single HTML file, < 150 KB
- **PWA**: Offline-capable via service worker cache
- **OCR**: ~2–5 seconds per scan
- **Database**: Indexed queries for fast retrieval
- **Caching**: Static assets cached by service worker

## 🐛 Known Issues

- Free-tier deployment sleeps after 15 min inactivity (30–60 s wake time)
- OCR accuracy depends on handwriting clarity and image contrast
- Mobile gestures require a touch-capable device

## 🚧 Future Enhancements

- [ ] Rich text editing (bold, italic, lists)
- [ ] Note sharing with public links
- [ ] Voice notes
- [ ] Note templates
- [ ] Reminders and notifications
- [ ] Note version history
- [ ] Offline OCR with on-device models
- [ ] Multi-language OCR support
- [ ] Collaborative editing

## 📄 License

This project was created as part of an internship program.

## 🙏 Acknowledgments

- Google Cloud Vision API for OCR capabilities
- Tesseract OCR for fallback recognition
- Render for hosting services
- Neon for PostgreSQL database

---

**Live Demo**: [https://persistent-ai-ml-internship.onrender.com](https://persistent-ai-ml-internship.onrender.com)
