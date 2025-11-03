# MainWeb (SE2 Refactored)

## Table of Contents
- [Project Overview](#project-overview)  
- [Tech Stack (Main frameworks)](#tech-stack-main-frameworks)  
- [Database](#database)  
- [Modules & Responsibilities](#modules--responsibilities)  
- [Installed Packages / Plugins](#installed-packages--plugins)  
- [Getting Started](#getting-started)  
  - [Backend (development)](#backend-development)  
  - [Frontend (development)](#frontend-development)  
- [Production Notes](#production-notes)  
- [References](#references)

## Project Overview
MainWeb is a two-tier web application composed of a Python/Django backend that exposes RESTful APIs and a React single-page frontend. The repository separates server-side logic (backend/) from the client-side application (frontend/), enabling independent development and deployment.

## Tech Stack (Main frameworks)
- Backend: Python with Django (project scaffold references Django 5.2.7) using Django REST Framework for API endpoints and Simple JWT for token-based authentication. CORS is handled via django-cors-headers.  
- Frontend: JavaScript with React (Create React App, React 19) using react-scripts for build/dev tasks and react-router-dom for client-side routing. Tailwind CSS is used for styling (configured as a dev dependency).

(See `backend/manage.py`, `backend/chonkyweb_backend/settings.py`, and `frontend/package.json` for configuration evidence.)

## Database
- Development: SQLite (`django.db.backends.sqlite3`, `db.sqlite3`) as configured in `backend/chonkyweb_backend/settings.py`.  
- Production: replace SQLite with a production-grade RDBMS (e.g., PostgreSQL or MySQL) and update `DATABASES` in Django settings and environment configuration.

## Modules & Responsibilities
The codebase is organized into Django apps and a React component tree. Representative modules include:

- accounts — user registration, authentication, and profile management (backend/auth endpoints, frontend login/register views).  
- orders — order creation, processing, and listing endpoints and UI.  
- inventory — product/resource inventory management.  
- pets — domain-specific models and endpoints for pet-related data.  
- services — service catalog management and related UI.  
- appointments — scheduling and appointment management.  

(Exact app names and locations are under `backend/` and React sources under `frontend/src/`.)

## Installed Packages / Plugins
Backend (declared in Django settings / environment):
- Django (scaffold references v5.2.7)  
- djangorestframework (Django REST Framework)  
- djangorestframework-simplejwt (JWT auth)  
- django-cors-headers (CORS handling)

Frontend (`frontend/package.json` highlights):
- react, react-dom (React 19)  
- react-scripts (Create React App tooling)  
- react-router-dom (client-side routing)  
- tailwindcss (devDependency; utility-first CSS)

Database:
- SQLite (development)

(For full, exact dependency lists and versions, inspect `frontend/package.json` and your Python environment/`requirements.txt` if present.)

## Getting Started

Backend (development)
1. Activate your virtual environment:
   - PowerShell: `.\venv\Scripts\Activate`
2. Install Python dependencies:
   - `pip install -r requirements.txt`
3. Apply migrations and run:
   - `cd backend`
   - `python manage.py migrate`
   - `python manage.py runserver`
4. Backend entrypoint: `backend/manage.py`

Frontend (development)
1. Install dependencies:
   - `cd frontend`
   - `npm install`
2. Start the dev server:
   - `npm start`  
Frontend entrypoint and scripts are defined in `frontend/package.json`.

## Production Notes 
- Build frontend for production with `npm run build` and serve the static files from a web server or via Django static setup.  
- Ensure SECRET_KEY, DEBUG, DB credentials and allowed hosts are set appropriately in production settings or via environment variables.

## References
- `backend/manage.py`  
- `backend/chonkyweb_backend/settings.py`  
- `frontend/package.json`

Contributions, bug reports, and improvements are welcome. Please follow repository contribution guidelines if present.






