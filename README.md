# Sleep Apnea Management System

A comprehensive web application for managing sleep apnea patients, tracking their data, and monitoring treatment progress.

## Features

- 👤 Patient Management
- 📊 Sleep Data Tracking
- 📈 Analytics and Reporting
- 🔐 Secure Authentication
- 📱 Responsive Design
- 💾 Data Export Capabilities

## Tech Stack

**Backend:**
- Node.js
- Express.js
- PostgreSQL with Sequelize ORM
- JWT Authentication

**Frontend:**
- React
- React Router
- Axios
- Chart.js for visualizations

## Installation

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Setup

1. Clone the repository
2. Install dependencies:
```bash
npm run install:all
```

3. Set up PostgreSQL database:
```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE sleep_apnea_db;

# Exit psql
\q
```

4. Create `.env` file in root directory (use `.env.example` as template):
```
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sleep_apnea_db
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_secret_key
NODE_ENV=development
```

5. Run the application:
```bash
# Development mode (backend only)
npm run dev

# Frontend only
npm run client

# Both concurrently
npm run dev:full
```

The database tables will be created automatically on first run.

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login user

### Patients
- GET `/api/patients` - Get all patients
- GET `/api/patients/:id` - Get patient by ID
- POST `/api/patients` - Create new patient
- PUT `/api/patients/:id` - Update patient
- DELETE `/api/patients/:id` - Delete patient

### Sleep Data
- GET `/api/sleep-data/:patientId` - Get sleep data for patient
- POST `/api/sleep-data` - Add new sleep data entry
- PUT `/api/sleep-data/:id` - Update sleep data entry
- DELETE `/api/sleep-data/:id` - Delete sleep data entry

## License

MIT
