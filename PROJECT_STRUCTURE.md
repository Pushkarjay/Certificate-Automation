# Project Structure - Certificate Automation System

## 📁 Optimized Monorepo Structure

This project has been restructured to eliminate redundant dependencies and optimize the development/deployment workflow.

### Root Level
```
certificate-automation/
├── package.json          # Monorepo orchestrator (no dependencies)
├── jsconfig.json         # VS Code configuration
├── render.yaml           # Deployment configuration
├── README.md             # Project documentation
├── .gitignore           # Git ignore rules
└── .env.example         # Environment template
```

### Backend (`backend/`)
```
backend/
├── package.json          # Backend dependencies (canvas, sharp, express, etc.)
├── package-lock.json     # Locked backend dependencies
├── server.js             # Main server file
├── .env                  # Backend environment variables
├── API/                  # API endpoints
├── services/             # Business logic services
├── Certificate_Templates/ # Certificate templates and fonts
└── generated-certificates/ # Output directory
```

### Frontend (`Frontend/React/`)
```
Frontend/React/
├── package.json          # React app dependencies
├── package-lock.json     # Locked frontend dependencies
├── src/                  # React source code
├── public/               # Public assets
└── build/                # Production build (generated)
```

## 🎯 Key Improvements

### 1. **Eliminated Redundant Dependencies**
- ❌ **Before**: Root had duplicate `canvas` and `sharp` packages
- ✅ **After**: Dependencies only where they're used (backend)

### 2. **Cleaner Deployment**
- ❌ **Before**: Install root → backend → frontend (3 steps)
- ✅ **After**: Install backend → frontend (2 steps)

### 3. **Better Scripts**
```json
{
  "install:backend": "cd backend && npm install",
  "install:frontend": "cd Frontend/React && npm install", 
  "install:all": "npm run install:backend && npm run install:frontend",
  "clean": "rm -rf backend/node_modules Frontend/React/node_modules",
  "dev": "npm run dev:backend & npm run dev:frontend"
}
```

### 4. **Updated Dependencies**
- `canvas`: `2.11.2` → `3.1.2`
- `sharp`: `0.32.6` → `0.34.3`

## 🚀 Development Commands

```bash
# Install all dependencies
npm run install:all

# Development mode
npm run dev

# Backend only
npm run dev:backend

# Frontend only  
npm run dev:frontend

# Production build
npm run build

# Clean all node_modules
npm run clean:win  # Windows
npm run clean      # Unix/Linux
```

## 📦 Deployment

The project is optimized for Render deployment:
1. Install backend dependencies
2. Install frontend dependencies  
3. Build React app
4. Start backend server

No root-level dependencies needed! 🎉
