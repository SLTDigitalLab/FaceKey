# FaceKey - Building Access Control System

A comprehensive building access control system with a FastAPI backend and React frontend for managing buildings, doors, and authorized users.

## Project Structure

```
FaceKey/
├── backend/           # FastAPI backend application
├── frontend/          # React frontend application
├── Data/             # JSON data storage
│   └── door_access/  # Building and door data
├── logs/             # Application logs
├── config.ini        # API configuration
└── requirements.txt  # Python dependencies
```

## Prerequisites

- Python 3.8+
- Node.js 16+ and npm
- Virtual environment (recommended)

## Setup & Installation

### Backend Setup

1. **Create and activate virtual environment** (if not already activated):

   ```bash
   python -m venv .venv
   .venv\Scripts\Activate.ps1  # Windows PowerShell
   # or
   source .venv/bin/activate   # Linux/Mac
   ```

2. **Install Python dependencies**:

   ```bash
   pip install -r requirements.txt
   ```

3. **Configure API settings** (optional):
   Edit `config.ini` to update the Visage API credentials if needed.

4. **Run the backend server**:
   ```bash
   cd backend
   python main.py
   ```
   The API will be available at `http://localhost:8000`
   API documentation at `http://localhost:8000/docs`

### Frontend Setup

1. **Install Node.js dependencies**:

   ```bash
   cd frontend
   npm install
   ```

2. **Run the development server**:
   ```bash
   npm run dev
   ```
   The frontend will be available at `http://localhost:5173`

## Features

- **Dashboard Overview**: View statistics and recent activity
- **Buildings Management**: Add/Edit/Delete buildings
- **Door Management**: Add/Edit/Delete doors and assign them to buildings
- **Employee Management**: Link employees from the central Visage server and assign door access permissions
- **Access Logs**: View history of door access events
- **User Validation**: Validate users against the central Visage API

## API Configuration

The `config.ini` file contains settings for connecting to the central Visage API:

```ini
[API]
user = your_username
key = your_api_key
url = https://visage.sltdigitallab.lk/api/username_val
```

## Data Storage

All data is stored in JSON files in the `Data/door_access/` directory:

- `buildings.json` - Building information
- `doors.json` - Door configurations and access rules

## Development

- **Backend**: FastAPI with Python 3.8+, uses Pydantic for data validation
- **Frontend**: React 18 with Vite, Bootstrap for styling
- **API Version**: v1 (accessible at `/api/v1/door-access`)

## Logs

Application logs are stored in the `logs/` directory with detailed information about system operations and errors.
