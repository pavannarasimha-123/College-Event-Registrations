const http = require('http');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const connectDB = require('../config/db');
const app = require('../server');

let server;
const PORT = 5001; // Run test on port 5001 to avoid any port conflicts

// Helper to make HTTP requests
const request = (method, endpoint, headers = {}, body = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(`http://127.0.0.1:${PORT}${endpoint}`);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

const assert = (condition, message) => {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`✅ PASSED: ${message}`);
};

const runAllTests = async () => {
  console.log('====================================================');
  console.log('Starting College Event Registration Portal Test Suite');
  console.log('====================================================\n');

  try {
    // 0. Ensure Database is connected
    console.log('[Test Setup] Connecting to database...');
    await connectDB();

    // Start HTTP Server
    await new Promise((resolve) => {
      server = app.listen(PORT, () => {
        console.log(`[Test Server] Running on http://127.0.0.1:${PORT}\n`);
        resolve();
      });
    });

    // 1. Health Check
    console.log('--- Test 1: Health Check ---');
    const health = await request('GET', '/api/health');
    assert(health.status === 200 && health.data.status === 'healthy', 'Server is healthy');

    // 2. Invalid Login
    console.log('\n--- Test 2: Invalid Login Credentials ---');
    const badLogin = await request('POST', '/api/auth/login', {}, {
      email: 'nonexistent@college.edu',
      password: 'wrongpassword'
    });
    assert(badLogin.status === 401, 'Invalid login rejected with status 401');

    // 3. Admin Login
    console.log('\n--- Test 3: Admin Login ---');
    const adminLogin = await request('POST', '/api/auth/login', {}, {
      email: process.env.ADMIN_EMAIL || 'admin@college.edu',
      password: process.env.ADMIN_PASSWORD || 'Admin@12345'
    });
    assert(adminLogin.status === 200, 'Admin login returns 200');
    assert(adminLogin.data.token && adminLogin.data.user.role === 'admin', 'Admin JWT token & role verified');
    const adminToken = adminLogin.data.token;

    // 4. Student Registration
    console.log('\n--- Test 4: Student Registration ---');
    const testStudentEmail = `student_${Date.now()}@college.edu`;
    const studentRegister = await request('POST', '/api/auth/register', {}, {
      name: 'John Student',
      email: testStudentEmail,
      password: 'Student@12345'
    });
    assert(studentRegister.status === 201, 'Student registered with status 201');
    assert(studentRegister.data.user.role === 'student', 'New registered user defaults to student role');

    // 5. Duplicate Student Email Registration Prevention
    console.log('\n--- Test 5: Prevent Duplicate Student Registration (Email) ---');
    const dupRegister = await request('POST', '/api/auth/register', {}, {
      name: 'Duplicate Student',
      email: testStudentEmail,
      password: 'Student@12345'
    });
    assert(dupRegister.status === 400, 'Duplicate email registration rejected with status 400');

    // 6. Student Login
    console.log('\n--- Test 6: Student Login ---');
    const studentLogin = await request('POST', '/api/auth/login', {}, {
      email: testStudentEmail,
      password: 'Student@12345'
    });
    assert(studentLogin.status === 200, 'Student login successful with status 200');
    assert(studentLogin.data.token && studentLogin.data.user.role === 'student', 'Student JWT token & role verified');
    const studentToken = studentLogin.data.token;

    // 7. Role Authorization Guard (Student cannot create event)
    console.log('\n--- Test 7: Role Authorization Guard (Student cannot create event) ---');
    const forbiddenCreate = await request('POST', '/api/events', {
      Authorization: `Bearer ${studentToken}`
    }, {
      eventTitle: 'Unauthorized Event',
      category: 'Technical',
      eventDate: '2026-10-15',
      venue: 'Lab 1',
      organizer: 'Hacker',
      maximumParticipants: 10
    });
    assert(forbiddenCreate.status === 403, 'Student creating event rejected with 403 Forbidden');

    // 8. Admin Creates Event
    console.log('\n--- Test 8: Admin Creates Event (AI Workshop, capacity: 2) ---');
    const createEventRes = await request('POST', '/api/events', {
      Authorization: `Bearer ${adminToken}`
    }, {
      eventTitle: 'AI Workshop',
      category: 'Workshop',
      eventDate: new Date(Date.now() + 86400000 * 10).toISOString(),
      venue: 'Seminar Hall',
      organizer: 'CSE Department',
      maximumParticipants: 2 // Set to 2 to test capacity limit easily
    });
    assert(createEventRes.status === 201, 'Admin successfully created AI Workshop event (201)');
    const event = createEventRes.data.event;
    const eventId = event._id;
    assert(event.eventTitle === 'AI Workshop', 'Event title matches');
    assert(event.maximumParticipants === 2, 'Capacity is 2');

    // 9. Student Browses Events
    console.log('\n--- Test 9: Student Browses Events List ---');
    const eventsListRes = await request('GET', '/api/events');
    assert(eventsListRes.status === 200, 'Events list retrieved with status 200');
    const foundEvent = eventsListRes.data.events.find((e) => e.eventId === event.eventId || e._id === eventId);
    assert(foundEvent !== undefined, 'AI Workshop found in public events list');
    assert(foundEvent.availableSeats === 2 && foundEvent.registeredCount === 0, 'Initial seats available: 2/2');

    // 10. Student 1 Registers for AI Workshop
    console.log('\n--- Test 10: Student 1 Registers for Event ---');
    const regRes1 = await request('POST', '/api/registrations/registerEvent', {
      Authorization: `Bearer ${studentToken}`
    }, { eventId });
    assert(regRes1.status === 201, 'Student 1 successfully registered with status 201');
    assert(regRes1.data.registration.participationStatus === 'Registered', 'Participation status is Registered');
    const registrationId1 = regRes1.data.registration._id;

    // 11. CRITICAL TEST: Prevent Duplicate Registration (Database level compound index test)
    console.log('\n--- Test 11: Prevent Duplicate Registration for Same Student + Event ---');
    const dupRegRes = await request('POST', '/api/registrations/registerEvent', {
      Authorization: `Bearer ${studentToken}`
    }, { eventId });
    assert(dupRegRes.status === 409, 'Duplicate event registration rejected with status 409');
    console.log('   Rejection message:', dupRegRes.data.message);

    // 12. Register Student 2 (Fills Event Capacity)
    console.log('\n--- Test 12: Student 2 Registers (Event reaches 2/2 capacity) ---');
    const student2Email = `student2_${Date.now()}@college.edu`;
    await request('POST', '/api/auth/register', {}, {
      name: 'Student Two',
      email: student2Email,
      password: 'Password@123'
    });
    const student2Login = await request('POST', '/api/auth/login', {}, {
      email: student2Email,
      password: 'Password@123'
    });
    const student2Token = student2Login.data.token;

    const regRes2 = await request('POST', '/api/registrations/registerEvent', {
      Authorization: `Bearer ${student2Token}`
    }, { eventId });
    assert(regRes2.status === 201, 'Student 2 successfully registered (Capacity now 2/2)');

    // 13. CRITICAL TEST: Event Capacity Exceeded Rejection
    console.log('\n--- Test 13: Event Full Capacity Rejection ---');
    const student3Email = `student3_${Date.now()}@college.edu`;
    await request('POST', '/api/auth/register', {}, {
      name: 'Student Three',
      email: student3Email,
      password: 'Password@123'
    });
    const student3Login = await request('POST', '/api/auth/login', {}, {
      email: student3Email,
      password: 'Password@123'
    });
    const student3Token = student3Login.data.token;

    const fullRegRes = await request('POST', '/api/registrations/registerEvent', {
      Authorization: `Bearer ${student3Token}`
    }, { eventId });
    assert(fullRegRes.status === 400, 'Registration on full event rejected with status 400');
    console.log('   Capacity rejection message:', fullRegRes.data.message);

    // 14. Student 1 Views "My Registrations"
    console.log('\n--- Test 14: Student Views My Registrations ---');
    const myRegs = await request('GET', '/api/registrations/myRegistrations', {
      Authorization: `Bearer ${studentToken}`
    });
    assert(myRegs.status === 200, 'My Registrations fetched with status 200');
    assert(myRegs.data.registrations.length === 1, 'Student 1 has 1 active registration');
    assert(myRegs.data.registrations[0].eventId.eventTitle === 'AI Workshop', 'Registered event title is AI Workshop');

    // 15. Admin Views Event Participants
    console.log('\n--- Test 15: Admin Views Event Participants ---');
    const participantsRes = await request('GET', `/api/registrations/event/${eventId}`, {
      Authorization: `Bearer ${adminToken}`
    });
    assert(participantsRes.status === 200, 'Event participants fetched with status 200');
    assert(participantsRes.data.count === 2, '2 registered participants returned');
    assert(participantsRes.data.participants.some(p => p.studentName === 'John Student'), 'John Student listed in participants');
    assert(participantsRes.data.participants.some(p => p.studentName === 'Student Two'), 'Student Two listed in participants');

    // 16. Admin Dashboard Stats
    console.log('\n--- Test 16: Real-time Admin Dashboard Stats from MongoDB ---');
    const statsRes = await request('GET', '/api/events/admin/stats', {
      Authorization: `Bearer ${adminToken}`
    });
    assert(statsRes.status === 200, 'Admin stats retrieved with status 200');
    assert(statsRes.data.totalEvents >= 1, 'Total events is >= 1');
    assert(statsRes.data.totalRegistrations >= 2, 'Total registrations is >= 2');
    console.log(`   Real stats: totalEvents=${statsRes.data.totalEvents}, totalRegistrations=${statsRes.data.totalRegistrations}, upcomingEvents=${statsRes.data.upcomingEvents}`);

    // 17. Admin Edits Event
    console.log('\n--- Test 17: Admin Edits Event Details ---');
    const updateRes = await request('PUT', `/api/events/${eventId}`, {
      Authorization: `Bearer ${adminToken}`
    }, {
      venue: 'Main Auditorium & Conference Hall',
      maximumParticipants: 35
    });
    assert(updateRes.status === 200, 'Event updated successfully (200)');
    assert(updateRes.data.event.venue === 'Main Auditorium & Conference Hall', 'Venue update verified');
    assert(updateRes.data.event.maximumParticipants === 35, 'Capacity update verified');

    // 18. Student Cancels Registration
    console.log('\n--- Test 18: Student Cancels Registration ---');
    const cancelRes = await request('DELETE', `/api/registrations/cancelRegistration/${registrationId1}`, {
      Authorization: `Bearer ${studentToken}`
    });
    assert(cancelRes.status === 200, 'Registration cancelled successfully with status 200');

    // Verify seat is freed up
    const afterCancelEvent = await request('GET', `/api/events/${eventId}`);
    assert(afterCancelEvent.data.event.registeredCount === 1, 'Registered count decremented to 1 after cancellation');

    // 19. Admin Deletes Event and Cascades Deletion of Registrations
    console.log('\n--- Test 19: Admin Deletes Event (Cascade Deletion) ---');
    const deleteRes = await request('DELETE', `/api/events/${eventId}`, {
      Authorization: `Bearer ${adminToken}`
    });
    assert(deleteRes.status === 200, 'Event deleted with status 200');
    assert(deleteRes.data.removedRegistrationsCount >= 1, 'Associated registrations cascaded and deleted');

    // 20. Student Verifies Deleted Event No Longer Appears in My Registrations
    console.log('\n--- Test 20: Verify Deleted Event Removed from My Registrations ---');
    const myRegsAfterDelete = await request('GET', '/api/registrations/myRegistrations', {
      Authorization: `Bearer ${student2Token}`
    });
    assert(myRegsAfterDelete.data.registrations.length === 0, 'No orphaned registrations remain for student');

    // 21. Invalid / Tampered JWT Authentication Test
    console.log('\n--- Test 21: Invalid JWT Verification ---');
    const invalidJwtRes = await request('GET', '/api/registrations/myRegistrations', {
      Authorization: 'Bearer invalid.fake.token'
    });
    assert(invalidJwtRes.status === 403 || invalidJwtRes.status === 401, 'Invalid JWT correctly rejected');

    console.log('\n====================================================');
    console.log('🎉 ALL 21 TEST SUITE ASSERTIONS PASSED ON ATLAS!');
    console.log('====================================================\n');
  } catch (err) {
    console.error('\n❌ Test suite failed:', err);
    process.exitCode = 1;
  } finally {
    if (server) {
      server.close();
    }
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(process.exitCode || 0);
  }
};

runAllTests();
