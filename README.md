# MediTalk

A modern telehealth web platform where patients and doctors can connect, chat in real-time, manage appointments, complete post-consultation payments, and exchange prescriptions.

## Why MediTalk
MediTalk is built to cover the complete online consultation journey:
- Find verified doctors
- Chat and schedule appointments
- Complete consultation sessions
- Pay consultation fee after session
- Receive/send structured prescriptions

## Features
- Role-based authentication (Patient, Doctor, Admin)
- Real-time chat with typing indicators
- Appointment request, confirmation, meeting join, completion
- Post-consultation payment workflow
- Doctor prescription form with medicine details
- In-chat prescription delivery
- Notification system for workflow events
- Ratings and reviews
- Doctor listing with consultation fee visibility

## Tech Stack
### Frontend
- React + Vite
- Tailwind CSS
- Redux Toolkit
- Axios
- Socket.IO Client

### Backend
- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- Socket.IO
- Multer

## Project Structure
```text
MediTalk/
  backend/
    src/
      config/
      controllers/
      middleware/
      models/
      routes/
      services/
      socket/
      utils/
  frontend/
    src/
      components/
      pages/
      services/
      store/
      utils/
```

## Prerequisites
- Node.js (v18 or above recommended)
- npm
- MongoDB (local or cloud)

## Quick Start
### 1) Clone and open project
```bash
git clone <your-repo-url>
cd MediTalk
```

### 2) Setup backend
```bash
cd backend
npm install
```

Create a `.env` file in backend directory with values like:
```env
PORT=5000
MONGO_URI=<your_mongodb_connection_string>
JWT_SECRET=<your_secret_key>
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

Run backend:
```bash
npm run dev
```

### 3) Setup frontend
Open a new terminal:
```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173` by default.

## Production Build
```bash
cd frontend
npm run build
npm run preview
```

## Default Workflow (Payment to Prescription)
1. Doctor and patient complete consultation.
2. Patient sees payment action in chat.
3. Patient submits payment details (mock payment).
4. Doctor is notified that payment is complete.
5. Doctor sends prescription form.
6. Patient receives prescription in chat.

## API Overview (High-Level)
- Auth: `/api/auth/*`
- Doctors: `/api/doctors/*`
- Appointments: `/api/appointments/*`
- Chat: `/api/chat/*`
- Notifications: `/api/notifications/*`
- Payments: `/api/payments/*`
- Prescriptions: `/api/prescriptions/*`

## Notes
- Payment is currently mock-based for demonstration/testing.
- Real gateway integration can be added later (Stripe/Razorpay).

## Documentation Files
- `PROJECT_REPORT.md` - professional high-level report
- `PPT_8_SLIDES_CONTENT.md` - ready-to-copy 8-slide presentation content

## License
For academic and project demonstration use.
