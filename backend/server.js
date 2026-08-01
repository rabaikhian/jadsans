import express from 'express';
import cors from 'cors';
import session from 'express-session';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { dbService } from './database.js';
import { googleCalendarService } from './googleCalendar.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Trust proxy (required for Render, Railway, etc.)
if (IS_PRODUCTION) {
  app.set('trust proxy', 1);
}

// Express session setup
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback_session_secret_xyz',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: IS_PRODUCTION,
    sameSite: IS_PRODUCTION ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// CORS Configuration
app.use(cors({
  origin: FRONTEND_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-session-token'],
  credentials: true // allows sending cookies back and forth
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Token-based Session Fallback (Safari / Cross-site ITP fix) ---
// Reads Authorization: Bearer <token> or x-session-token header and
// hydrates req.session.user from the persistent sessions.json DB.
app.use((req, res, next) => {
  if (!req.session.user) {
    const authHeader = req.headers['authorization'] || '';
    const headerToken = req.headers['x-session-token'] || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : headerToken;
    if (token) {
      const user = dbService.getSession(token);
      if (user) {
        req.session.user = user;
        req.tokenAuth = token; // remember which token was used
      }
    }
  }
  next();
});

// --- Request Logging ---
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// --- Auth Endpoints ---

// Get current session status
app.get('/auth/status', (req, res) => {
  if (req.session.user) {
    res.json({
      authenticated: true,
      user: req.session.user,
      isMockMode: googleCalendarService.isMock()
    });
  } else {
    res.json({
      authenticated: false,
      isMockMode: googleCalendarService.isMock()
    });
  }
});

// Redirect to Google Consent Page
app.get('/auth/google', (req, res) => {
  const { account } = req.query;
  try {
    if (googleCalendarService.isMock()) {
      if (account) {
        res.redirect(`/auth/google/mock-callback?account=${account}`);
      } else {
        // Send a beautiful Google Account Chooser simulation UI page
        res.send(`
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Sign in - Google Accounts</title>
            <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
            <style>
              body {
                font-family: 'Roboto', sans-serif;
                background-color: #f0f4f9;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                margin: 0;
                padding: 16px;
                box-sizing: border-box;
              }
              .card {
                background: #ffffff;
                border-radius: 28px;
                padding: 40px;
                width: 100%;
                max-width: 400px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.04);
                text-align: center;
                border: 1px solid #e0e0e0;
                box-sizing: border-box;
              }
              .logo {
                margin-bottom: 16px;
              }
              h1 {
                font-size: 24px;
                font-weight: 400;
                color: #1f1f1f;
                margin: 0 0 8px 0;
              }
              .subtitle {
                font-size: 16px;
                color: #444746;
                margin-bottom: 32px;
              }
              .account-list {
                display: flex;
                flex-direction: column;
                margin-bottom: 24px;
                text-align: left;
                border: 1px solid #e0e0e0;
                border-radius: 12px;
                overflow: hidden;
              }
              .account-item {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 16px;
                background: #ffffff;
                border: none;
                cursor: pointer;
                transition: background 0.15s;
                width: 100%;
                text-align: left;
                font-family: inherit;
              }
              .account-item:not(:last-child) {
                border-bottom: 1px solid #e0e0e0;
              }
              .account-item:hover {
                background: #f8f9fa;
              }
              .avatar {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                object-fit: cover;
              }
              .details {
                display: flex;
                flex-direction: column;
              }
              .name {
                font-size: 14px;
                font-weight: 500;
                color: #1f1f1f;
              }
              .email {
                font-size: 12px;
                color: #5f6368;
              }
              .footer {
                font-size: 11px;
                color: #5f6368;
                line-height: 1.5;
                margin-top: 32px;
                background: #f8f9fa;
                padding: 12px;
                border-radius: 8px;
                border: 1px solid #e9ecef;
              }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="logo">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
              </div>
              <h1>Choose an account</h1>
              <div class="subtitle">to continue to <b>StudentScheduler</b></div>
              
              <div class="account-list">
                <button class="account-item" onclick="location.href='/auth/google/mock-callback?account=1'">
                  <img class="avatar" src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120" alt="Mock Student Dev">
                  <div class="details">
                    <span class="name">Mock Student Dev</span>
                    <span class="email">mock.student@gmail.com</span>
                  </div>
                </button>
                <button class="account-item" onclick="location.href='/auth/google/mock-callback?account=2'">
                  <img class="avatar" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120" alt="Teacher Rose">
                  <div class="details">
                    <span class="name">Teacher Rose</span>
                    <span class="email">mock.teacher2@gmail.com</span>
                  </div>
                </button>
              </div>

              <div class="footer">
                To use a real Google account, configure Google client credentials in your server environment <code>.env</code> file.
              </div>
            </div>
          </body>
          </html>
        `);
      }
    } else {
      const authUrl = googleCalendarService.getAuthUrl();
      res.redirect(authUrl);
    }
  } catch (error) {
    console.error('Error generating Google auth URL:', error);
    res.status(500).json({ error: 'Auth initialization failed' });
  }
});

// OAuth Callback handler
app.get('/auth/google/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.status(400).send('OAuth authorization code is missing.');
  }

  try {
    const userProfile = await googleCalendarService.handleAuthCallback(code);
    const sessionUser = {
      email: userProfile.email,
      name: userProfile.name,
      picture: userProfile.picture
    };
    req.session.user = sessionUser;
    // Generate a persistent token so Safari (no cross-site cookies) can authenticate
    const token = crypto.randomBytes(32).toString('hex');
    dbService.saveSession(token, sessionUser);
    res.redirect(`${FRONTEND_URL}/?auth_token=${token}`);
  } catch (error) {
    console.error('OAuth callback failed:', error);
    res.status(500).send(`OAuth Authentication failed: ${error.message}`);
  }
});

// Simulated Login Callback (For Dev Mode without Google Keys)
app.get('/auth/google/mock-callback', async (req, res) => {
  const { account } = req.query;
  try {
    let userProfile;
    if (account === '2') {
      userProfile = {
        email: 'mock.teacher2@gmail.com',
        name: 'Teacher Rose',
        picture: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120'
      };
    } else {
      userProfile = {
        email: 'mock.student@gmail.com',
        name: 'Mock Student Dev',
        picture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120'
      };
    }
    req.session.user = userProfile;
    // Generate a persistent token so Safari (no cross-site cookies) can authenticate
    const token = crypto.randomBytes(32).toString('hex');
    dbService.saveSession(token, userProfile);
    res.redirect(`${FRONTEND_URL}/?auth_token=${token}`);
  } catch (error) {
    console.error('Mock login failed:', error);
    res.status(500).send('Mock authentication failed.');
  }
});

// Logout endpoint
app.post('/auth/logout', (req, res) => {
  // Also delete the persistent token session if it was used
  const authHeader = req.headers['authorization'] || '';
  const headerToken = req.headers['x-session-token'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : headerToken;
  if (token) {
    dbService.deleteSession(token);
  }
  req.session.destroy((err) => {
    if (err) {
      console.error('Session destruction error during logout:', err);
      return res.status(500).json({ error: 'Could not log out' });
    }
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
});


// --- Scheduling API Endpoints ---

// Helper to parse HH:MM to minutes
const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

// Helper to find free time slots on a day that don't conflict with overlap
const findRecommendedSlots = (date, sameDateBookings, studentName, durationMinutes = 60) => {
  const recommendations = [];
  // Search common hours from 08:00 to 21:00 in 30-minute steps
  const startSearch = 8 * 60;
  const endSearch = 21 * 60;

  for (let mins = startSearch; mins <= endSearch - durationMinutes; mins += 30) {
    const startB = mins;
    const endB = mins + durationMinutes;

    let conflict = false;
    for (const b of sameDateBookings) {
      const startA = timeToMinutes(b.start_time);
      const endA = timeToMinutes(b.end_time);

      // Check if student names match
      const isSameStudent = b.student_name.split(', ').some(n1 => 
        studentName.split(', ').some(n2 => n1.trim() === n2.trim())
      );

      // Only check absolute overlap (consecutive slots are fully allowed)
      const overlap = (startB < endA && startA < endB);
      if (overlap) {
        conflict = true;
        break;
      }
    }

    if (!conflict) {
      const startStr = `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
      const endStr = `${String(Math.floor((mins + durationMinutes) / 60)).padStart(2, '0')}:${String((mins + durationMinutes) % 60).padStart(2, '0')}`;
      recommendations.push(`${startStr}-${endStr}`);
      if (recommendations.length >= 3) break;
    }
  }
  return recommendations;
};

// Get all bookings (Master calendar list)
app.get('/api/bookings', (req, res) => {
  try {
    let bookings = dbService.getAllBookings();
    
    // Detect owner filter or session email filter
    const { owner } = req.query;
    const activeEmail = owner || (req.session.user ? req.session.user.email : null);
    
    if (activeEmail) {
      bookings = bookings.filter(b => (b.user_email || 'mock.student@gmail.com') === activeEmail);
    } else {
      // Anonymous public visit to root without owner parameter:
      // Default to the first mock account's bookings to keep dashboard populated.
      bookings = bookings.filter(b => (b.user_email || 'mock.student@gmail.com') === 'mock.student@gmail.com');
    }
    
    res.json(bookings);
  } catch (error) {
    console.error('Error loading bookings:', error);
    res.status(500).json({ error: 'Failed to retrieve bookings' });
  }
});

// Create booking + Sync with Google Calendar
app.post('/api/bookings', async (req, res) => {
  const { class_name, student_name, date, start_time, end_time, notes, color, location, class_type } = req.body;

  if (!class_name || !student_name || !date || !start_time || !end_time) {
    return res.status(400).json({ error: 'Required fields missing' });
  }

  try {
    // 30-minute buffer travel-time check between different students
    const startB = timeToMinutes(start_time);
    const endB = timeToMinutes(end_time);
    const userEmail = req.session.user ? req.session.user.email : 'mock.student@gmail.com';
    const sameDateBookings = dbService.getAllBookings().filter(b => 
      b.date === date && 
      (b.user_email || 'mock.student@gmail.com') === userEmail
    );

    for (const b of sameDateBookings) {
      const startA = timeToMinutes(b.start_time);
      const endA = timeToMinutes(b.end_time);

      // Only check absolute overlap (consecutive slots are fully allowed)
      const overlap = (startB < endA && startA < endB);
      if (overlap) {
        const duration = endB - startB;
        const recs = findRecommendedSlots(date, sameDateBookings, student_name, duration);
        const recStr = recs.length > 0 ? recs.join(', ') : 'ไม่มีช่วงเวลาอื่นที่ว่างในวันนี้';
        return res.status(400).json({
          error: `ไม่สามารถลงตารางเวลานี้ได้ (พร้อมแนะนำช่วงเวลาที่สามารถลงเวลาได้อื่นให้: ${recStr})`
        });
      }
    }

    let googleEventId = null;

    // Check if user is authenticated to sync with their calendar
    if (req.session.user && req.session.user.email) {
      const email = req.session.user.email;
      console.log(`Syncing new booking to Google Calendar for: ${email}`);
      try {
        googleEventId = await googleCalendarService.createEvent(email, {
          class_name,
          student_name,
          date,
          start_time,
          end_time,
          notes,
          color,
          location,
          class_type
        });
      } catch (syncErr) {
        console.error('Failed to sync to Google Calendar. Saving locally only.', syncErr.message);
      }
    } else {
      console.warn('Booking created while not signed in to Google. Local-only save.');
    }

    const newBooking = dbService.createBooking({
      class_name,
      student_name,
      date,
      start_time,
      end_time,
      notes,
      color,
      location,
      class_type,
      google_event_id: googleEventId,
      user_email: userEmail
    });

    res.status(201).json(newBooking);
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ error: 'Failed to create scheduling booking record' });
  }
});

// Update booking + Sync changes
app.put('/api/bookings/:id', async (req, res) => {
  const { id } = req.params;
  const { class_name, student_name, date, start_time, end_time, notes, color, location, class_type, status } = req.body;

  if (!class_name || !student_name || !date || !start_time || !end_time) {
    return res.status(400).json({ error: 'Required fields missing' });
  }

  try {
    const existingBooking = dbService.getBookingById(id);
    if (!existingBooking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // 30-minute buffer travel-time check between different students (excluding self)
    const startB = timeToMinutes(start_time);
    const endB = timeToMinutes(end_time);
    const userEmail = req.session.user ? req.session.user.email : 'mock.student@gmail.com';
    const sameDateBookings = dbService.getAllBookings().filter(b => 
      b.date === date && 
      b.id !== Number(id) && 
      (b.user_email || 'mock.student@gmail.com') === userEmail
    );

    for (const b of sameDateBookings) {
      const startA = timeToMinutes(b.start_time);
      const endA = timeToMinutes(b.end_time);

      // Only check absolute overlap (consecutive slots are fully allowed)
      const overlap = (startB < endA && startA < endB);
      if (overlap) {
        const duration = endB - startB;
        const recs = findRecommendedSlots(date, sameDateBookings, student_name, duration);
        const recStr = recs.length > 0 ? recs.join(', ') : 'ไม่มีช่วงเวลาอื่นที่ว่างในวันนี้';
        return res.status(400).json({
          error: `ไม่สามารถลงตารางเวลานี้ได้ (พร้อมแนะนำช่วงเวลาที่สามารถลงเวลาได้อื่นให้: ${recStr})`
        });
      }
    }

    let googleEventId = existingBooking.google_event_id;
    // Use the booking's owner email (works even if cookie session expired)
    const calendarEmail = existingBooking.user_email || (req.session.user && req.session.user.email);

    // If status is being set to 'cancelled', delete from Google Calendar
    if (status === 'cancelled' && googleEventId && calendarEmail) {
      try {
        await googleCalendarService.deleteEvent(calendarEmail, googleEventId);
        console.log(`[GCal] Deleted event ${googleEventId} due to cancellation`);
        googleEventId = null; // clear so we don't re-create
      } catch (syncErr) {
        console.error(`[GCal] Failed to delete event on cancellation:`, syncErr.message);
      }
    } else if (status !== 'cancelled' && calendarEmail) {
      // Sync updates to Google Calendar
      const updatedEventDetails = { class_name, student_name, date, start_time, end_time, notes, color, location, class_type };

      if (googleEventId) {
        try {
          googleEventId = await googleCalendarService.updateEvent(calendarEmail, googleEventId, updatedEventDetails);
        } catch (syncErr) {
          console.error(`[GCal] Sync update failed for EventID ${googleEventId}:`, syncErr.message);
        }
      } else {
        // Event wasn't synced previously — create it now
        try {
          googleEventId = await googleCalendarService.createEvent(calendarEmail, updatedEventDetails);
        } catch (syncErr) {
          console.error('[GCal] Sync creation failed:', syncErr.message);
        }
      }
    }

    // Determine the final status to save: if date or start time changed, reset to 'scheduled'
    let finalStatus = status;
    const dateChanged = date !== existingBooking.date;
    const timeChanged = start_time !== existingBooking.start_time;
    if (dateChanged || timeChanged) {
      finalStatus = 'scheduled';
    } else if (finalStatus === undefined) {
      finalStatus = existingBooking.status || 'scheduled';
    }

    const updatedBooking = dbService.updateBooking(id, {
      class_name,
      student_name,
      date,
      start_time,
      end_time,
      notes,
      color,
      location,
      class_type,
      google_event_id: googleEventId,
      status: finalStatus
    });

    res.json(updatedBooking);
  } catch (error) {
    console.error(`Error updating booking ID ${id}:`, error);
    res.status(500).json({ error: 'Failed to update booking' });
  }
});

// Delete booking + remove from Google Calendar
app.delete('/api/bookings/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const booking = dbService.getBookingById(id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Delete from Google Calendar using the booking owner's email (not the active session)
    // This ensures deletion works even when the cookie session has expired (e.g. Safari ITP)
    const calendarEmail = booking.user_email || (req.session.user && req.session.user.email);
    if (booking.google_event_id && calendarEmail) {
      try {
        await googleCalendarService.deleteEvent(calendarEmail, booking.google_event_id);
        console.log(`[GCal] Deleted event ${booking.google_event_id} for booking ${id}`);
      } catch (syncErr) {
        console.error(`[GCal] Failed to delete event ${booking.google_event_id}:`, syncErr.message);
      }
    }

    const deleted = dbService.deleteBooking(id);
    if (deleted) {
      res.json({ success: true, message: 'Booking deleted successfully' });
    } else {
      res.status(500).json({ error: 'Failed to delete booking from database' });
    }
  } catch (error) {
    console.error(`Error deleting booking ID ${id}:`, error);
    res.status(500).json({ error: 'Server error deleting booking' });
  }
});

// --- Students API Endpoints ---
app.get('/api/students', (req, res) => {
  try {
    let students = dbService.getAllStudents();
    const { owner } = req.query;
    const activeEmail = owner || (req.session.user ? req.session.user.email : null);
    
    if (activeEmail) {
      students = students.filter(s => (s.user_email || 'mock.student@gmail.com') === activeEmail);
    } else {
      students = students.filter(s => (s.user_email || 'mock.student@gmail.com') === 'mock.student@gmail.com');
    }
    
    res.json(students);
  } catch (error) {
    console.error('Error loading students:', error);
    res.status(500).json({ error: 'Failed to retrieve students' });
  }
});

app.post('/api/students', (req, res) => {
  const { name, location, color, category, nickname, grade, enrolled_date, current_course, next_course, report, is_hidden } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  const targetCategory = category || 'งานสอน';

  try {
    const userEmail = req.session.user ? req.session.user.email : 'mock.student@gmail.com';
    const exists = dbService.getAllStudents().some(
      s => s.name.toLowerCase() === name.trim().toLowerCase() && 
           (s.category || 'งานสอน') === targetCategory &&
           (s.user_email || 'mock.student@gmail.com') === userEmail
    );
    if (exists) {
      return res.status(400).json({ error: 'Name already exists in this category' });
    }

    const newStudent = dbService.createStudent({ 
      name: name.trim(), 
      location: location || '', 
      color: color || '',
      category: targetCategory,
      nickname: nickname || '',
      grade: grade || '',
      enrolled_date: enrolled_date || '',
      current_course: current_course || '',
      next_course: next_course || '',
      report: report || '',
      is_hidden: is_hidden,
      user_email: userEmail
    });
    res.status(201).json(newStudent);
  } catch (error) {
    console.error('Error creating student:', error);
    res.status(500).json({ error: 'Failed to save student profile' });
  }
});

app.delete('/api/students/:id', (req, res) => {
  const { id } = req.params;
  try {
    const deleted = dbService.deleteStudent(id);
    if (deleted) {
      res.json({ success: true, message: 'Student deleted successfully' });
    } else {
      res.status(404).json({ error: 'Student not found' });
    }
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ error: 'Server error deleting student profile' });
  }
});

app.put('/api/students/:id', (req, res) => {
  const { id } = req.params;
  const { name, location, color, category, nickname, grade, enrolled_date, current_course, next_course, report, is_hidden } = req.body;
  try {
    const updated = dbService.updateStudent(id, { name, location, color, category, nickname, grade, enrolled_date, current_course, next_course, report, is_hidden });
    if (updated) {
      res.json(updated);
    } else {
      res.status(404).json({ error: 'Student not found' });
    }
  } catch (error) {
    console.error(`Error updating student ID ${id}:`, error);
    res.status(500).json({ error: 'Server error updating student profile' });
  }
});

app.get('/api/categories', (req, res) => {
  try {
    const categories = dbService.getAllCategories();
    res.json(categories);
  } catch (error) {
    console.error('Error retrieving categories:', error);
    res.status(500).json({ error: 'Server error retrieving categories' });
  }
});

app.post('/api/categories', (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Category name is required' });
  }
  try {
    const created = dbService.createCategory(name);
    res.json({ name: created });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Server error creating category' });
  }
});

app.put('/api/categories/:oldName', (req, res) => {
  const { oldName } = req.params;
  const { newName } = req.body;
  if (!newName || !newName.trim()) {
    return res.status(400).json({ error: 'New name is required' });
  }
  try {
    const result = dbService.updateCategory(oldName, newName.trim());
    res.json(result);
  } catch (error) {
    console.error(`Error updating category ${oldName}:`, error);
    res.status(500).json({ error: 'Server error updating category' });
  }
});

app.delete('/api/categories/:name', (req, res) => {
  const { name } = req.params;
  try {
    const result = dbService.deleteCategory(name);
    res.json(result);
  } catch (error) {
    console.error(`Error deleting category ${name}:`, error);
    res.status(500).json({ error: 'Server error deleting category' });
  }
});

app.get('/api/backup', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Unauthorized: Please log in first' });
  }
  try {
    const data = {
      bookings: dbService.getAllBookings(),
      students: dbService.getAllStudents(),
      topics: dbService.getAllTopics(),
      categories: dbService.getAllCategories()
    };
    res.json(data);
  } catch (error) {
    console.error('Error generating backup:', error);
    res.status(500).json({ error: 'Server error generating backup' });
  }
});

app.post('/api/restore', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Unauthorized: Please log in first' });
  }
  try {
    const result = dbService.restoreBackup(req.body);
    res.json(result);
  } catch (error) {
    console.error('Error restoring backup:', error);
    res.status(500).json({ error: 'Server error restoring backup' });
  }
});

// --- Topics API ---
app.get('/api/topics', (req, res) => {
  try {
    const topics = dbService.getAllTopics();
    res.json(topics);
  } catch (error) {
    console.error('Error retrieving topics:', error);
    res.status(500).json({ error: 'Server error retrieving topics' });
  }
});

app.post('/api/topics', (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Topic name is required' });
  }
  try {
    const saved = dbService.createTopic(name);
    res.status(201).json(saved);
  } catch (error) {
    console.error('Error creating topic:', error);
    res.status(500).json({ error: 'Server error saving course topic' });
  }
});

app.delete('/api/topics/:name', (req, res) => {
  const { name } = req.params;
  try {
    dbService.deleteTopic(name);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting topic:', error);
    res.status(500).json({ error: 'Server error deleting topic' });
  }
});

app.put('/api/topics/:oldName', (req, res) => {
  const { oldName } = req.params;
  const { newName } = req.body;
  if (!newName || !newName.trim()) {
    return res.status(400).json({ error: 'New topic name is required' });
  }
  try {
    const updated = dbService.updateTopic(oldName, newName.trim());
    if (updated) {
      res.json(updated);
    } else {
      res.status(404).json({ error: 'Topic not found' });
    }
  } catch (error) {
    console.error('Error updating topic:', error);
    res.status(500).json({ error: 'Server error updating topic' });
  }
});

// Start express listener
app.listen(PORT, () => {
  console.log(`🚀 Scheduling Server is running at http://localhost:${PORT}`);
});
