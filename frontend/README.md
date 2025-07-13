🧠 AI Hallucination Playground - Local Development Setup
<img width="544" height="544" alt="image" src="https://github.com/user-attachments/assets/615ab7e3-018b-420e-b501-e06b86e34c9c" />

# 📋 Prerequisites
## Before you begin, ensure you have the following installed:
<p>Node.js (v18 or higher) - Download here
<p>Python (v3.8 or higher) - Download here
<p>Git -
<p>Ollama
<p>dolphin-phi:latest | c5761fc77240  
<p>llama3.1:8b-instruct-q4_0 | 42182419e950  

# Quick Start
 ## Start Backend
<p>cd backend
  
## Install Python dependencies

<p>pip install flask flask-cors requests edge-tts

# Start the server
<p>python3 trip_server.py
  
# You should see:
## 🧠 AI Hallucination Playground - Open Source Backend Starting...
## 📡 Server: http://localhost:5000
## ✨ Ready for unlimited hallucinations!

# Start Frontend (Terminal 2)
<p>cd frontend
  
# Install dependencies
<p>npm install
  
## Start development server
<p>npm run dev
  
## You should see:
 <p>VITE v5.x.x  ready in xxx ms

<p>  ➜  Local:   http://localhost:5173/
<p> ➜  Network: use --host to expose
  
## Open Your Browser
<p>Visit http://localhost:5173 and start creating! 🎨

# Development Workflow
## Feature Development
<p> Create feature branch
<p> git checkout -b feature/amazing-feature

# Make changes to frontend/backend
## Test your changes locally

# Commit with descriptive message
<p> git commit -m "✨ feat: add amazing feature"

# Push and create pull request
<p>git push origin feature/amazing-feature
2. Hot Reloading

Frontend: Vite provides instant hot module replacement
Backend: Flask debug mode restarts on file changes
Database: SQLite changes persist between restarts

# API Development

<p>Backend runs on http://localhost:5000
<p>API endpoints are automatically available
<p>Test endpoints with browser or Postman
