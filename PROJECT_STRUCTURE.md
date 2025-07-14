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

### 3. **Better Scripts - Sequential Approach**
```json
{
  "install:all": "npm install && cd backend && npm install && cd .. && cd Frontend/React && npm install && cd ../..",
  "install:backend": "cd backend && npm install && cd ..",
  "install:frontend": "cd Frontend/React && npm install && cd ../..",
  "dev:backend": "cd backend && npm run dev",
  "dev:frontend": "cd Frontend/React && npm start",
  "clean": "rm -rf backend/node_modules Frontend/React/node_modules"
}
```

**Why Sequential Approach?**
- ✅ **Cross-platform compatible** - Works on Windows, Linux, macOS
- ✅ **No additional dependencies** - No need for concurrently or complex tools
- ✅ **Clear execution flow** - Easy to debug and understand
- ✅ **Reliable navigation** - Explicit directory changes with proper returns

### 4. **Updated Dependencies**
- `canvas`: `2.11.2` → `3.1.2`
- `sharp`: `0.32.6` → `0.34.3`

## 🚀 Development Commands

```bash
# Install all dependencies (sequential approach)
npm run install:all

# Install specific components
npm run install:backend   # Backend only
npm run install:frontend  # Frontend only

# Development mode (run separately)
npm run dev:backend       # Start backend dev server
npm run dev:frontend      # Start React dev server (separate terminal)

# Production
npm run build            # Build React app
npm start               # Start production server

# Clean up
npm run clean           # Unix/Linux
npm run clean:win       # Windows
```

**Development Workflow:**
1. Run `npm run install:all` once to install all dependencies
2. Open two terminals:
   - Terminal 1: `npm run dev:backend` (API server on port 5000)
   - Terminal 2: `npm run dev:frontend` (React dev server on port 3000)

## 📦 Deployment

The project is optimized for Render deployment with sequential installation:

**Build Process:**
1. `npm install` (root - minimal dependencies)
2. `cd backend && npm install` (API dependencies)  
3. `cd Frontend/React && npm install && npm run build` (React build)
4. `cd backend && npm start` (Start production server)

**Benefits:**
- ✅ **No root-level dependencies** - Clean separation
- ✅ **Sequential execution** - Reliable and debuggable
- ✅ **Cross-platform** - Works everywhere
- ✅ **Simple deployment** - No complex orchestration needed

Perfect for production! 🎉
