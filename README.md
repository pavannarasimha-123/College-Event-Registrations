# College Event Registration Portal (MERN Stack)

A full-stack web application designed for managing and participating in college events, built specifically for a college **MERN Stack Mini-Project Evaluation**.

The portal provides role-based authentication and features for **Students** (browse events, view capacity, register, manage registrations) and **Administrators** (event CRUD, live dashboard statistics, participant attendance tracking).

---

## 🛠️ Technology Stack

- **Frontend:** React 18, Vite, React Router v6, Axios, Modern Semantic CSS
- **Backend:** Node.js, Express.js (REST API Architecture)
- **Database:** MongoDB Atlas / Local MongoDB (v8.x/v7.x) via Mongoose ODM
- **Authentication & Security:** JSON Web Tokens (JWT), bcryptjs password hashing
- **Language:** JavaScript (ES6+ CommonJS for Server, ES Modules for Client)
- **Testing:** Postman Collection, Automated End-to-End Test Suite

---

## 📂 Project Structure

```
college-event-registration/
│
├── client/                               # React + Vite Frontend
│   ├── public/                           # Static assets
│   ├── src/
│   │   ├── components/                   # Reusable UI components
│   │   │   ├── Navbar.jsx                # Role-aware responsive navigation
│   │   │   ├── EventCard.jsx             # Event card with seat capacity badges
│   │   │   ├── EventForm.jsx             # Create/Edit event modal form
│   │   │   ├── ProtectedRoute.jsx        # Role-based route guard
│   │   │   ├── LoadingSpinner.jsx        # Accessible loading state
│   │   │   └── ErrorMessage.jsx          # Error alerts with retry button
│   │   ├── pages/                        # Required application pages
│   │   │   ├── Home.jsx                  # Hero, overview, upcoming preview
│   │   │   ├── Register.jsx              # Student registration with validation
│   │   │   ├── Login.jsx                 # Role-based redirection login
│   │   │   ├── StudentDashboard.jsx      # Student schedule & metrics
│   │   │   ├── EventList.jsx             # Filterable/searchable event cards
│   │   │   ├── EventDetails.jsx          # Full details & one-click register
│   │   │   ├── MyRegistrations.jsx       # Student registered list & cancel
│   │   │   ├── AdminDashboard.jsx        # Live MongoDB aggregate statistics
│   │   │   └── ManageEvents.jsx          # Full Admin CRUD & participant viewer
│   │   ├── context/
│   │   │   └── AuthContext.jsx           # JWT auth state & user session
│   │   ├── services/
│   │   │   ├── api.js                    # Axios instance with JWT interceptor
│   │   │   ├── authService.js            # Auth API calls
│   │   │   ├── eventService.js           # Event CRUD API calls
│   │   │   └── registrationService.js    # Registration API calls
│   │   ├── routes/
│   │   │   └── AppRoutes.jsx             # React Router routing setup
│   │   ├── App.jsx                       # Root React app container
│   │   ├── index.css                     # Minimal, modern collegiate styling
│   │   └── main.jsx                      # Vite entry point
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── server/                               # Node.js + Express Backend
│   ├── config/
│   │   └── db.js                         # Mongoose MongoDB connection
│   ├── models/
│   │   ├── User.js                       # User schema (userId, role, etc.)
│   │   ├── Event.js                      # Event schema (eventId, capacity, etc.)
│   │   └── Registration.js               # Registration schema (compound index)
│   ├── controllers/
│   │   ├── authController.js             # Register, login, profile
│   │   ├── eventController.js            # Event CRUD & MongoDB aggregations
│   │   └── registrationController.js     # Register event, cancel, participants
│   ├── routes/
│   │   ├── authRoutes.js                 # /api/auth
│   │   ├── eventRoutes.js                # /api/events
│   │   └── registrationRoutes.js         # /api/registrations
│   ├── middleware/
│   │   ├── authMiddleware.js             # JWT verification middleware
│   │   ├── roleMiddleware.js             # Student / Admin authorization
│   │   └── errorMiddleware.js            # Centralized Express error handler
│   ├── scripts/
│   │   ├── seedAdmin.js                  # Admin seed script
│   │   ├── seedSampleEvents.js           # Populates initial campus events
│   │   └── testScenario.js               # Automated 21-point test suite
│   ├── server.js                         # Express application entry
│   └── package.json
│
├── POSTMAN_TESTING.md                    # Complete Postman testing guide
├── college_event_portal.postman_collection.json # Importable Postman collection
├── .env.example                          # Environment variable templates
├── package.json                          # Root runner scripts
└── README.md                             # Documentation
```

---

## 🗄️ Database Design (Mongoose Models)

### 1. `Users` Collection
| Field | Type | Attributes | Description |
|---|---|---|---|
| `userId` | String | Unique | Human-readable user identifier (`USR-...`) |
| `name` | String | Required, Trim | Full name of the user |
| `email` | String | Required, Unique, Lowercase | College email address |
| `password` | String | Required | Bcrypt-hashed password (cost factor 10) |
| `role` | String | Enum: `['student', 'admin']` | Defaults to `'student'` |

### 2. `Events` Collection
| Field | Type | Attributes | Description |
|---|---|---|---|
| `eventId` | String | Unique | Event identifier (`EVT-...`) |
| `eventTitle` | String | Required, Trim | Title of the event |
| `category` | String | Required | e.g. Technical, Cultural, Sports, Workshop |
| `eventDate` | Date | Required | Scheduled date of event |
| `venue` | String | Required, Trim | Location / Hall / Auditorium |
| `organizer` | String | Required, Trim | Organizing department or student club |
| `maximumParticipants` | Number | Required, Min: 1 | Seat capacity limit |

### 3. `Registrations` Collection
| Field | Type | Attributes | Description |
|---|---|---|---|
| `registrationId` | String | Unique | Registration ticket ID (`REG-...`) |
| `studentId` | ObjectId | Ref: `'User'`, Required | Reference to the registered student |
| `eventId` | ObjectId | Ref: `'Event'`, Required | Reference to the event |
| `registrationDate` | Date | Default: `Date.now` | Timestamp of registration |
| `participationStatus`| String | Enum: `['Registered', 'Attended', 'Cancelled']` | Status |

> **Compound Unique Index:**  
> `{ studentId: 1, eventId: 1 }` with `{ unique: true }`.  
> Guarantees at the database level that duplicate registrations are prevented even under concurrent network requests.

---

## 🚀 Key Business Rules Implemented

1. **Role Separation & Route Protection:**
   - Public visitors can view the Home page and browse the Event List.
   - Registration creates a **student** account only (public admin creation is disabled).
   - Students cannot access `/admin/*` routes.
   - Admins cannot register for events as participants.
2. **Duplicate Registration Prevention:**
   - Evaluated both logically in `registrationController.js` and enforced atomically by MongoDB's unique compound index.
3. **Event Capacity Enforcement:**
   - Active registrations (`participationStatus = 'Registered'`) are counted.
   - If `registeredCount >= maximumParticipants`, the registration request is rejected with `400 Bad Request: "This event is full"`.
4. **Cascade Deletion on Event Removal:**
   - When an Administrator deletes an event, all associated registrations are deleted (`Registration.deleteMany({ eventId })`) to prevent orphan records.
5. **Real-time MongoDB Aggregation:**
   - The Admin Dashboard queries MongoDB to calculate live stats (`totalEvents`, `totalRegistrations`, `upcomingEvents`).

---

## ⚡ Setup & Installation

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or newer recommended)
- [MongoDB](https://www.mongodb.com/) (Local service or MongoDB Atlas URI)

### 2. Environment Variables Setup
Create `server/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/college_event_db
JWT_SECRET=college_event_portal_jwt_secret_key_2026_super_secure
ADMIN_NAME=College Admin
ADMIN_EMAIL=pavan@gmail.com
ADMIN_PASSWORD=pavan123
```
*(For MongoDB Atlas, replace `MONGODB_URI` with your connection string: `mongodb+srv://<username>:<password>@cluster0...`)*

Create `client/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Install Dependencies
From the root directory:
```bash
npm run install-all
```
*(Or navigate to `server/` and `client/` separately and run `npm install`)*

### 4. Seed Admin & Initial Events
Seed the admin account from `.env`:
```bash
npm run seed:admin
```
Seed sample campus events (optional, for instant demo data):
```bash
node server/scripts/seedSampleEvents.js
```

### 5. Start the Application
Run the backend server (Port 5000):
```bash
npm run server
```

In a second terminal, run the frontend client (Port 5173):
```bash
npm run client
```

Open your browser at: **`http://localhost:5173`**

---

## 🧪 Automated Verification Test Suite

An end-to-end automated test script simulates the exact rubric scenario (Admin seed, Admin login, Event creation, Student registration, Duplicate check, Full event limit, Participant listing, Cancellation, Cascade delete):

```bash
node server/scripts/testScenario.js
```

---

## 📡 API Endpoints Reference

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register new Student account |
| `POST` | `/api/auth/login` | Public | Login for Student / Admin, returns JWT |
| `GET` | `/api/auth/me` | Authenticated | Get current authenticated user profile |
| `GET` | `/api/events` | Public | List all events with available seat counts |
| `GET` | `/api/events/:id` | Public | Get single event details with capacity stats |
| `POST` | `/api/events` | Admin | Create a new college event |
| `PUT` | `/api/events/:id` | Admin | Update event details |
| `DELETE` | `/api/events/:id` | Admin | Delete event and cascade delete registrations |
| `GET` | `/api/events/admin/stats` | Admin | Real-time dashboard statistics |
| `POST` | `/api/registrations/registerEvent` | Student | Register student for an event |
| `GET` | `/api/registrations/myRegistrations` | Student | List registrations of logged-in student |
| `DELETE` | `/api/registrations/cancelRegistration/:id` | Student/Admin | Cancel registration and free up seat |
| `GET` | `/api/registrations/event/:eventId` | Admin | View participant list for an event |

---

## 📬 Postman Testing
- See [POSTMAN_TESTING.md](./POSTMAN_TESTING.md) for full endpoint-by-endpoint details.
- Alternatively, import [college_event_portal.postman_collection.json](./college_event_portal.postman_collection.json) directly into Postman.
