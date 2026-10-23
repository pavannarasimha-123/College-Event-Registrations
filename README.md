# 🎓 College Event Registration Portal

A full-stack MERN web application for managing college events. Students can browse and register for events, while admins create and manage events and track registrations.

🔗 **Live Demo:** [college-event-registrations.onrender.com](https://college-event-registrations.onrender.com)

---

## ✨ Features

**Student**
- Register and log in securely
- Browse available college events
- Register for events and view registration status
- Password reset via email

**Admin**
- Dedicated admin dashboard
- Create, update, and delete events
- View and manage event registrations

**General**
- JWT-based authentication and role-based access
- RESTful API tested with Postman
- Deployed on Render

## 🛠️ Tech Stack

| Layer      | Technology                    |
| ---------- | ----------------------------- |
| Frontend   | React                         |
| Backend    | Node.js, Express.js           |
| Database   | MongoDB (Atlas)               |
| Auth       | JWT, bcrypt                   |
| Email      | Nodemailer (password reset)   |
| Deployment | Render                        |

## 📁 Project Structure

```
College-Event-Registrations/
├── client/                  # React frontend
├── server/                  # Express backend (routes, models, controllers)
├── .env.example             # Environment variable template
├── POSTMAN_TESTING.md       # API testing guide
├── college_event_portal.postman_collection.json
└── package.json             # Root scripts for build and deploy
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)

### 1. Clone the repository
```bash
git clone https://github.com/pavannarasimha-123/College-Event-Registrations.git
cd College-Event-Registrations
```

### 2. Configure environment variables
Copy `.env.example` to `.env` and fill in the values:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
EMAIL_USER=your_email_address
EMAIL_PASS=your_email_app_password
CLIENT_URL=http://localhost:5173
PORT=5000
```

### 3. Install dependencies
```bash
npm install
cd client && npm install
cd ../server && npm install
```

### 4. Run the app
```bash
# Terminal 1: backend
cd server
npm run dev

# Terminal 2: frontend
cd client
npm run dev
```

Frontend runs on `http://localhost:5173` and the API on `http://localhost:5000`.

## 🧪 API Testing

Import `college_event_portal.postman_collection.json` into Postman. Full instructions are in [POSTMAN_TESTING.md](./POSTMAN_TESTING.md).

## ☁️ Deployment

Deployed on **Render** as a single web service. The root `package.json` installs dependencies and builds the client in a `postinstall` step, and the Express server serves the production build.

Set the same environment variables from `.env.example` in the Render dashboard.

## 🔮 Future Improvements

- Event categories and search filters
- QR-based check-in for attendance
- Email confirmation on registration
- Analytics dashboard for admins

## 👤 Author

**Pavan Narasimha**
GitHub: [@pavannarasimha-123](https://github.com/pavannarasimha-123)

---

⭐ If you found this useful, consider starring the repo.
