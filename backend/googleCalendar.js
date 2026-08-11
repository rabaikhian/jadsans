import { google } from 'googleapis';
import dotenv from 'dotenv';
import { dbService } from './database.js';

dotenv.config();

const clientID = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/auth/google/callback';

const hasCredentials = clientID && clientSecret && 
                       !clientID.includes('YOUR_GOOGLE_CLIENT_ID') && 
                       !clientSecret.includes('YOUR_GOOGLE_CLIENT_SECRET');

if (!hasCredentials) {
  console.warn('⚠️ Google OAuth Credentials not configured. Running in MOCK CALENDAR MODE.');
}

// Create the oauth2 client
const createOAuth2Client = () => {
  if (!hasCredentials) return null;
  return new google.auth.OAuth2(clientID, clientSecret, redirectUri);
};

export const googleCalendarService = {
  isMock() {
    return !hasCredentials;
  },

  getAuthUrl() {
    if (!hasCredentials) {
      // Return a simulated URL that frontend can capture
      return '/auth/google/mock-callback';
    }

    const oauth2Client = createOAuth2Client();
    return oauth2Client.generateAuthUrl({
      access_type: 'offline', // crucial for getting refresh_token
      prompt: 'consent',
      scope: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
      ]
    });
  },

  async handleAuthCallback(code) {
    if (!hasCredentials) {
      // Mock login session
      return {
        email: 'mock.student@gmail.com',
        name: 'Mock Student Dev',
        picture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120'
      };
    }

    const oauth2Client = createOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Retrieve user profile information
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    const email = userInfo.data.email;
    const name = userInfo.data.name || 'Google User';
    const picture = userInfo.data.picture || '';

    // Save tokens in database for offline/background syncing
    await dbService.saveUserTokens(email, tokens);

    return { email, name, picture, tokens };
  },

  async getAuthClientForUser(email) {
    if (!hasCredentials) return null;

    const tokens = await dbService.getUserTokens(email);
    if (!tokens) {
      throw new Error(`No OAuth tokens found for user: ${email}`);
    }

    const oauth2Client = createOAuth2Client();
    oauth2Client.setCredentials({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date
    });

    // Handle token refresh events automatically
    oauth2Client.on('tokens', async (newTokens) => {
      console.log(`Refreshing access token for user: ${email}`);
      await dbService.saveUserTokens(email, newTokens);
    });

    // Check if token is expired or close to expiring, and refresh it proactively
    const isExpired = tokens.expiry_date ? Date.now() >= tokens.expiry_date - 60000 : true;
    if (isExpired && tokens.refresh_token) {
      try {
        console.log(`Token is expired or expiring soon. Refreshing manually for: ${email}`);
        const { credentials } = await oauth2Client.refreshAccessToken();
        await dbService.saveUserTokens(email, credentials);
        oauth2Client.setCredentials(credentials);
      } catch (err) {
        console.error(`Failed to refresh Google OAuth token for user ${email}:`, err.message);
      }
    }

    return oauth2Client;
  },

  // Helper to format booking as Google Calendar event resource
  _formatEvent(booking) {
    // start_time: "HH:MM", date: "YYYY-MM-DD"
    // Google Calendar accepts RFC3339 with timezone offset (like +07:00 for Thailand)
    const startISO = `${booking.date}T${booking.start_time}:00+07:00`;
    const endISO = `${booking.date}T${booking.end_time}:00+07:00`;

    const eventLocation = booking.class_type === 'Online'
      ? 'Online (Zoom / Meet)'
      : (booking.location || '');

    return {
      summary: booking.class_name,
      location: eventLocation,
      description: `Student: ${booking.student_name}\nClass Type: ${booking.class_type || 'Onsite'}\nNotes: ${booking.notes || ''}\nCreated via Student Scheduling Web Application`,
      start: {
        dateTime: startISO,
        timeZone: 'Asia/Bangkok'
      },
      end: {
        dateTime: endISO,
        timeZone: 'Asia/Bangkok'
      },
      reminders: {
        useDefault: true
      }
    };
  },

  async getOrCreateCalendar(email, auth, calendarName) {
    if (!calendarName || calendarName.trim() === '') {
      return 'primary';
    }
    const name = calendarName.trim();
    
    try {
      const calendar = google.calendar({ version: 'v3', auth });
      const listRes = await calendar.calendarList.list();
      const existing = listRes.data.items.find(item => item.summary === name);
      if (existing) {
        return existing.id;
      }
      
      console.log(`[GOOGLE CALENDAR] Creating new calendar: "${name}" for ${email}`);
      const newCal = await calendar.calendars.insert({
        requestBody: {
          summary: name,
          timeZone: 'Asia/Bangkok'
        }
      });
      return newCal.data.id;
    } catch (err) {
      console.error(`[GOOGLE CALENDAR] Error in getOrCreateCalendar for "${name}":`, err.message);
      return 'primary';
    }
  },

  async createEvent(email, booking) {
    if (!hasCredentials) {
      const mockEventId = `mock_event_${Math.random().toString(36).substring(2, 11)}`;
      console.log(`[MOCK CALENDAR] Created event "${booking.class_name}" for ${email}. EventID: ${mockEventId}`);
      return { google_event_id: mockEventId, google_event_ids: { [email]: mockEventId } };
    }

    const eventIds = {};
    try {
      const partners = await dbService.getPartners(email);
      const categories = await dbService.getAllCategories();
      const catObj = categories.find(c => c.name === booking.class_name);
      const calendarName = catObj ? catObj.google_calendar_name : '';

      for (const partner of partners) {
        try {
          const auth = await this.getAuthClientForUser(partner);
          const calendarId = await this.getOrCreateCalendar(partner, auth, calendarName);
          
          const calendar = google.calendar({ version: 'v3', auth });
          const eventResource = this._formatEvent(booking);

          const response = await calendar.events.insert({
            calendarId,
            resource: eventResource
          });
          eventIds[partner] = response.data.id;
          console.log(`[GOOGLE CALENDAR] Successfully created event for ${partner}. EventID: ${response.data.id}`);
        } catch (err) {
          console.warn(`[GOOGLE CALENDAR] Skip creating event for partner ${partner}:`, err.message);
        }
      }
    } catch (error) {
      console.error('[GOOGLE CALENDAR] Error creating event:', error.message);
    }
    
    const primaryId = eventIds[email] || Object.values(eventIds)[0] || '';
    return { google_event_id: primaryId, google_event_ids: eventIds };
  },

  async updateEvent(email, googleEventId, booking, googleEventIds = {}) {
    if (!googleEventId && Object.keys(googleEventIds || {}).length === 0) return null;

    if (!hasCredentials) {
      console.log(`[MOCK CALENDAR] Updated event ID ${googleEventId} with new details: "${booking.class_name}"`);
      return { google_event_id: googleEventId, google_event_ids: googleEventIds };
    }

    const eventIds = { ...(googleEventIds || {}) };
    try {
      const partners = await dbService.getPartners(email);
      const categories = await dbService.getAllCategories();
      const catObj = categories.find(c => c.name === booking.class_name);
      const calendarName = catObj ? catObj.google_calendar_name : '';

      for (const partner of partners) {
        const partnerEventId = eventIds[partner] || (partner === email ? googleEventId : null);
        try {
          const auth = await this.getAuthClientForUser(partner);
          const calendarId = await this.getOrCreateCalendar(partner, auth, calendarName);
          const calendar = google.calendar({ version: 'v3', auth });
          const eventResource = this._formatEvent(booking);

          if (partnerEventId) {
            const response = await calendar.events.update({
              calendarId,
              eventId: partnerEventId,
              resource: eventResource
            });
            console.log(`[GOOGLE CALENDAR] Successfully updated event for ${partner}. EventID: ${response.data.id}`);
          } else {
            const response = await calendar.events.insert({
              calendarId,
              resource: eventResource
            });
            eventIds[partner] = response.data.id;
            console.log(`[GOOGLE CALENDAR] Created missing event for partner ${partner}. EventID: ${response.data.id}`);
          }
        } catch (err) {
          console.warn(`[GOOGLE CALENDAR] Skip updating event for partner ${partner}:`, err.message);
        }
      }
    } catch (error) {
      console.error('[GOOGLE CALENDAR] Error updating event:', error.message);
    }
    const primaryId = eventIds[email] || Object.values(eventIds)[0] || googleEventId;
    return { google_event_id: primaryId, google_event_ids: eventIds };
  },

  async deleteEvent(email, googleEventId, googleEventIds = {}, bookingCategory = '') {
    if (!googleEventId && Object.keys(googleEventIds || {}).length === 0) return false;

    if (!hasCredentials) {
      console.log(`[MOCK CALENDAR] Deleted event ID ${googleEventId}`);
      return true;
    }

    const eventIds = { ...(googleEventIds || {}) };
    try {
      const partners = await dbService.getPartners(email);
      const categories = await dbService.getAllCategories();
      const catObj = categories.find(c => c.name === bookingCategory);
      const calendarName = catObj ? catObj.google_calendar_name : '';

      for (const partner of partners) {
        const partnerEventId = eventIds[partner] || (partner === email ? googleEventId : null);
        if (!partnerEventId) continue;

        try {
          const auth = await this.getAuthClientForUser(partner);
          const calendarId = await this.getOrCreateCalendar(partner, auth, calendarName);
          const calendar = google.calendar({ version: 'v3', auth });

          await calendar.events.delete({
            calendarId,
            eventId: partnerEventId
          });
          console.log(`[GOOGLE CALENDAR] Successfully deleted event for ${partner}. EventID: ${partnerEventId}`);
        } catch (err) {
          console.warn(`[GOOGLE CALENDAR] Skip deleting event for partner ${partner}:`, err.message);
        }
      }
      return true;
    } catch (error) {
      console.error('[GOOGLE CALENDAR] Error deleting event:', error.message);
      return false;
    }
  }
};
