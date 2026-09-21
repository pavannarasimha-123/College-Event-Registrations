# College Event Registration Portal - Postman API Testing Guide

This guide provides the complete sequence for testing all REST endpoints using Postman or any HTTP client.

---

## Environment Variables for Postman
Create an Environment in Postman named **College Event Portal** with these keys:
- `baseUrl`: `http://localhost:5000/api`
- `studentToken`: *(Set dynamically or paste from student login)*
- `adminToken`: *(Set dynamically or paste from admin login)*
- `eventId`: *(Set after creating or fetching an event)*
- `registrationId`: *(Set after registering for an event)*

---

## 1. Student Testing Sequence

### 1.1 Register Student
- **Method:** `POST`
- **URL:** `{{baseUrl}}/auth/register`
- **Headers:**
  - `Content-Type: application/json`
- **Body (raw JSON):**
  ```json
  {
    "name": "Alex Student",
    "email": "alex.student@college.edu",
    "password": "Student@12345"
  }
  ```
- **Expected Status:** `201 Created`
- **Expected Response:**
  ```json
  {
    "message": "Student registered successfully. Please log in.",
    "user": {
      "id": "6aaf...",
      "userId": "USR-...",
      "name": "Alex Student",
      "email": "alex.student@college.edu",
      "role": "student"
    }
  }
  ```

---

### 1.2 Login Student
- **Method:** `POST`
- **URL:** `{{baseUrl}}/auth/login`
- **Headers:**
  - `Content-Type: application/json`
- **Body (raw JSON):**
  ```json
  {
    "email": "alex.student@college.edu",
    "password": "Student@12345"
  }
  ```
- **Expected Status:** `200 OK`
- **Expected Response:**
  ```json
  {
    "message": "Login successful.",
    "token": "eyJhbGciOi...",
    "user": {
      "id": "6aaf...",
      "userId": "USR-...",
      "name": "Alex Student",
      "email": "alex.student@college.edu",
      "role": "student"
    }
  }
  ```
> **Action:** Copy the `token` value and store it as `studentToken` in your environment or use in `Authorization: Bearer <token>`.

---

### 1.3 Get All Events (Public / Student)
- **Method:** `GET`
- **URL:** `{{baseUrl}}/events`
- **Headers:** None required
- **Expected Status:** `200 OK`
- **Expected Response:**
  ```json
  {
    "count": 5,
    "events": [
      {
        "_id": "6aaf8...",
        "eventId": "EVT-...",
        "eventTitle": "AI & Machine Learning Workshop",
        "category": "Workshop",
        "eventDate": "2026-...",
        "venue": "Seminar Hall 1, Block B",
        "organizer": "Computer Science Department",
        "maximumParticipants": 40,
        "registeredCount": 0,
        "availableSeats": 40,
        "isFull": false
      }
    ]
  }
  ```
> **Action:** Copy one event's `_id` and save as `eventId`.

---

### 1.4 Register for Event
- **Method:** `POST`
- **URL:** `{{baseUrl}}/registrations/registerEvent`
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer {{studentToken}}`
- **Body (raw JSON):**
  ```json
  {
    "eventId": "{{eventId}}"
  }
  ```
- **Expected Status:** `201 Created`
- **Expected Response:**
  ```json
  {
    "message": "Successfully registered for the event!",
    "registration": {
      "registrationId": "REG-...",
      "studentId": { "userId": "USR-...", "name": "Alex Student", "email": "alex.student@college.edu" },
      "eventId": { "eventTitle": "AI & Machine Learning Workshop", "category": "Workshop", ... },
      "participationStatus": "Registered",
      "_id": "6aaf..."
    }
  }
  ```
> **Action:** Note the `_id` of the created registration.

---

### 1.5 Duplicate Registration Test (Atomic Prevention)
- **Method:** `POST`
- **URL:** `{{baseUrl}}/registrations/registerEvent`
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer {{studentToken}}`
- **Body (raw JSON):**
  ```json
  {
    "eventId": "{{eventId}}"
  }
  ```
- **Expected Status:** `409 Conflict`
- **Expected Response:**
  ```json
  {
    "message": "You are already registered for this event."
  }
  ```

---

### 1.6 View My Registrations
- **Method:** `GET`
- **URL:** `{{baseUrl}}/registrations/myRegistrations`
- **Headers:**
  - `Authorization: Bearer {{studentToken}}`
- **Expected Status:** `200 OK`
- **Expected Response:**
  ```json
  {
    "count": 1,
    "registrations": [
      {
        "_id": "6aaf...",
        "registrationId": "REG-...",
        "participationStatus": "Registered",
        "registrationDate": "2026-...",
        "eventId": {
          "eventId": "EVT-...",
          "eventTitle": "AI & Machine Learning Workshop",
          "category": "Workshop",
          "eventDate": "...",
          "venue": "Seminar Hall 1, Block B"
        }
      }
    ]
  }
  ```

---

### 1.7 Cancel Registration
- **Method:** `DELETE`
- **URL:** `{{baseUrl}}/registrations/cancelRegistration/{{registrationId}}`
- **Headers:**
  - `Authorization: Bearer {{studentToken}}`
- **Expected Status:** `200 OK`
- **Expected Response:**
  ```json
  {
    "message": "Registration cancelled successfully.",
    "registrationId": "REG-..."
  }
  ```

---

## 2. Admin Testing Sequence

### 2.1 Admin Login
- **Method:** `POST`
- **URL:** `{{baseUrl}}/auth/login`
- **Headers:**
  - `Content-Type: application/json`
- **Body (raw JSON):**
  ```json
  {
    "email": "pavan@gmail.com",
    "password": "pavan123"
  }
  ```
- **Expected Status:** `200 OK`
- **Expected Response:**
  ```json
  {
    "message": "Login successful.",
    "token": "eyJhbGciOi...",
    "user": {
      "name": "College Admin",
      "email": "pavan@gmail.com",
      "role": "admin"
    }
  }
  ```
> **Action:** Save `token` as `adminToken`.

---

### 2.2 Get Admin Dashboard Real-Time Statistics
- **Method:** `GET`
- **URL:** `{{baseUrl}}/events/admin/stats`
- **Headers:**
  - `Authorization: Bearer {{adminToken}}`
- **Expected Status:** `200 OK`
- **Expected Response:**
  ```json
  {
    "totalEvents": 5,
    "totalRegistrations": 3,
    "upcomingEvents": 5
  }
  ```

---

### 2.3 Create Event
- **Method:** `POST`
- **URL:** `{{baseUrl}}/events`
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer {{adminToken}}`
- **Body (raw JSON):**
  ```json
  {
    "eventTitle": "Robotics & IoT Expo 2026",
    "category": "Technical",
    "eventDate": "2026-11-20T10:00:00.000Z",
    "venue": "Robotics Lab 3",
    "organizer": "Department of ECE",
    "maximumParticipants": 45
  }
  ```
- **Expected Status:** `201 Created`
- **Expected Response:**
  ```json
  {
    "message": "Event created successfully.",
    "event": {
      "_id": "6aaf...",
      "eventId": "EVT-...",
      "eventTitle": "Robotics & IoT Expo 2026",
      "category": "Technical",
      "maximumParticipants": 45
    }
  }
  ```

---

### 2.4 Update Event
- **Method:** `PUT`
- **URL:** `{{baseUrl}}/events/{{eventId}}`
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer {{adminToken}}`
- **Body (raw JSON):**
  ```json
  {
    "venue": "Advanced Mechatronics Hall & Lab",
    "maximumParticipants": 55
  }
  ```
- **Expected Status:** `200 OK`
- **Expected Response:**
  ```json
  {
    "message": "Event updated successfully.",
    "event": {
      "_id": "6aaf...",
      "venue": "Advanced Mechatronics Hall & Lab",
      "maximumParticipants": 55
    }
  }
  ```

---

### 2.5 View Event Participants
- **Method:** `GET`
- **URL:** `{{baseUrl}}/registrations/event/{{eventId}}`
- **Headers:**
  - `Authorization: Bearer {{adminToken}}`
- **Expected Status:** `200 OK`
- **Expected Response:**
  ```json
  {
    "event": {
      "_id": "...",
      "eventId": "EVT-...",
      "eventTitle": "Robotics & IoT Expo 2026",
      "maximumParticipants": 55,
      "registeredCount": 1
    },
    "count": 1,
    "participants": [
      {
        "studentName": "Alex Student",
        "studentEmail": "alex.student@college.edu",
        "userId": "USR-...",
        "registrationDate": "2026-...",
        "participationStatus": "Registered"
      }
    ]
  }
  ```

---

### 2.6 Delete Event (With Cascade Cleanup of Registrations)
- **Method:** `DELETE`
- **URL:** `{{baseUrl}}/events/{{eventId}}`
- **Headers:**
  - `Authorization: Bearer {{adminToken}}`
- **Expected Status:** `200 OK`
- **Expected Response:**
  ```json
  {
    "message": "Event and associated registrations deleted successfully.",
    "deletedEventId": "EVT-...",
    "removedRegistrationsCount": 1
  }
  ```
