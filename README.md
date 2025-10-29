# MainWeb
SE2

python -m venv venv

Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned

pip install django djangorestframework django-cors-headers djangorestframework-simplejwt

python.exe -m pip install --upgrade pip

# ==================================================== #




# ==================================================== #
assets/
Images, logos, SVGs

assets/
Images, logos, SVGs

hooks/
Reusable logic abstracted from components

layouts/
Templates that wrap pages with consistent UI (sidebar, header)

pages/
Each file equals a route (Home, Login, Profile)

services/
Centralized API requests to Django backend

utils/
Helper functions to avoid duplication

# ==================================================== #

project_root/
│
├── backend/
│   ├── manage.py
│   ├── backend/                  # Django project folder (replace with your project name)
│   │   ├── __init__.py
│   │   ├── settings.py
│   │   ├── urls.py
│   │   ├── wsgi.py
│   │   └── asgi.py
│   │
│   ├── accounts/                 # User + Admin accounts app
│   │   ├── migrations/
│   │   ├── __init__.py
│   │   ├── admin.py
│   │   ├── apps.py
│   │   ├── models.py             # Custom user models (if needed)
│   │   ├── serializers.py        # DRF serializers
│   │   ├── permissions.py
│   │   ├── urls.py               # Endpoints for login/register/profile
│   │   ├── views.py              # JWT login, signup, roles handling
│   │   └── tests.py
│   │
│   ├── core/                     # Shared utilities for backend
│   │   ├── __init__.py
│   │   ├── utils.py
│   │   └── pagination.py         # example
│   │
│   ├── requirements.txt
│   └── venv/                     # Virtual environment (optional display)
│
├── frontend/
│   ├── package.json
│   ├── public/
│   └── src/
│       ├── api/                  # Centralized request functions
│       │   └── apiClient.js
│       │
│       ├── hooks/                # Reusable logic
│       │   ├── useAuth.js        # Use token, login/logout helpers
│       │   └── useFetch.js
│       │
│       ├── components/           # Shared UI components
│       │   ├── Navbar.jsx
│       │   ├── ProtectedRoute.jsx
│       │   └── Loader.jsx
│       │
│       ├── pages/
│       │   ├── Admin/
│       │   │   ├── Dashboard.jsx
│       │   │   └── ManageUsers.jsx
│       │   │
│       │   ├── User/
│       │   │   ├── Profile.jsx
│       │   │   └── Home.jsx
│       │   │
│       │   ├── Login.jsx
│       │   └── Register.jsx
│       │
│       ├── styles/
│       │   ├── globals.css
│       │   └── layout.css
│       │
│       └── index.js
│
└── README.md
