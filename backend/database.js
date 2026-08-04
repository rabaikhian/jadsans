import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { MongoClient } from 'mongodb';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const bookingsPath = path.resolve(__dirname, 'bookings.json');
const tokensPath = path.resolve(__dirname, 'tokens.json');
const studentsPath = path.resolve(__dirname, 'students.json');
const topicsPath = path.resolve(__dirname, 'topics.json');
const categoriesPath = path.resolve(__dirname, 'categories.json');
const sessionsPath = path.resolve(__dirname, 'sessions.json');

// Initialize database files if they do not exist
const initFile = (filePath, initialData) => {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(initialData, null, 2), 'utf-8');
    console.log(`Local DB file created at: ${filePath}`);
  }
};

initFile(bookingsPath, []);
initFile(tokensPath, {});
initFile(studentsPath, []);
initFile(topicsPath, ["Math: Fractions", "Math: Algebra", "English: Grammar", "Science: Forces"]);
initFile(categoriesPath, ["งานสอน"]);
initFile(sessionsPath, {});

// Helper to read/write JSON files atomically
const readJSON = (filePath) => {
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return [];
  }
};

const writeJSON = (filePath, data) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
  }
};

// --- MongoDB Setup ---
let useMongo = false;
let db = null;
let client = null;

if (process.env.MONGODB_URI) {
  try {
    console.log('Connecting to MongoDB Atlas...');
    client = new MongoClient(process.env.MONGODB_URI, {
      connectTimeoutMS: 5000,
      serverSelectionTimeoutMS: 5000
    });
    await client.connect();
    db = client.db();
    useMongo = true;
    console.log('✅ Connected to MongoDB successfully. Using cloud database persistence!');
  } catch (err) {
    console.error('❌ Failed to connect to MongoDB, falling back to local JSON files:', err.message);
  }
} else {
  console.log('ℹ️ MONGODB_URI not provided. Using local JSON files for persistence.');
}

export const dbService = {
  // --- Bookings ---
  async getAllBookings() {
    let bookings;
    if (useMongo) {
      bookings = await db.collection('bookings').find({}).toArray();
    } else {
      bookings = readJSON(bookingsPath);
    }
    // Sort by date ascending, then start_time ascending
    return bookings.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.start_time.localeCompare(b.start_time);
    });
  },

  async getBookingById(id) {
    if (useMongo) {
      return await db.collection('bookings').findOne({ id: Number(id) });
    } else {
      const bookings = readJSON(bookingsPath);
      return bookings.find(b => b.id === Number(id)) || null;
    }
  },

  async createBooking({ class_name, student_name, date, start_time, end_time, notes, color, location, class_type, google_event_id, status, user_email }) {
    let newId;
    if (useMongo) {
      const maxDoc = await db.collection('bookings').find().sort({ id: -1 }).limit(1).next();
      newId = maxDoc ? maxDoc.id + 1 : 1;
    } else {
      const bookings = readJSON(bookingsPath);
      const maxId = bookings.reduce((max, b) => b.id > max ? b.id : max, 0);
      newId = maxId + 1;
    }

    const newBooking = {
      id: newId,
      class_name,
      student_name,
      date,
      start_time,
      end_time,
      notes: notes || '',
      color: color || 'hsl(260, 85%, 65%)',
      location: location || '',
      class_type: class_type || 'Onsite',
      google_event_id: google_event_id || null,
      status: status || 'scheduled',
      user_email: user_email || null,
      created_at: new Date().toISOString()
    };

    if (useMongo) {
      await db.collection('bookings').insertOne(newBooking);
    } else {
      const bookings = readJSON(bookingsPath);
      bookings.push(newBooking);
      writeJSON(bookingsPath, bookings);
    }
    console.log(`[DB] Created booking ID ${newId}`);
    return newBooking;
  },

  async updateBooking(id, { class_name, student_name, date, start_time, end_time, notes, color, location, class_type, google_event_id, status }) {
    if (useMongo) {
      const existing = await db.collection('bookings').findOne({ id: Number(id) });
      if (!existing) return null;

      const updatedBooking = {
        ...existing,
        class_name,
        student_name,
        date,
        start_time,
        end_time,
        notes: notes || '',
        color: color || existing.color || 'hsl(260, 85%, 65%)',
        location: location || existing.location || '',
        class_type: class_type || existing.class_type || 'Onsite',
        google_event_id: google_event_id !== undefined ? google_event_id : existing.google_event_id,
        status: status !== undefined ? status : existing.status,
        updated_at: new Date().toISOString()
      };

      await db.collection('bookings').updateOne({ id: Number(id) }, { $set: updatedBooking });
      console.log(`[DB] Updated booking ID ${id} in MongoDB`);
      return updatedBooking;
    } else {
      const bookings = readJSON(bookingsPath);
      const index = bookings.findIndex(b => b.id === Number(id));
      if (index === -1) return null;

      bookings[index] = {
        ...bookings[index],
        class_name,
        student_name,
        date,
        start_time,
        end_time,
        notes: notes || '',
        color: color || bookings[index].color || 'hsl(260, 85%, 65%)',
        location: location || bookings[index].location || '',
        class_type: class_type || bookings[index].class_type || 'Onsite',
        google_event_id: google_event_id !== undefined ? google_event_id : bookings[index].google_event_id,
        status: status !== undefined ? status : bookings[index].status,
        updated_at: new Date().toISOString()
      };

      writeJSON(bookingsPath, bookings);
      console.log(`[DB] Updated booking ID ${id} in JSON`);
      return bookings[index];
    }
  },

  async deleteBooking(id) {
    if (useMongo) {
      const existing = await db.collection('bookings').findOne({ id: Number(id) });
      if (!existing) return false;

      await db.collection('bookings').deleteOne({ id: Number(id) });
      console.log(`[DB] Deleted booking ID ${id} from MongoDB`);
      return existing;
    } else {
      const bookings = readJSON(bookingsPath);
      const index = bookings.findIndex(b => b.id === Number(id));
      if (index === -1) return false;

      const [deleted] = bookings.splice(index, 1);
      writeJSON(bookingsPath, bookings);
      console.log(`[DB] Deleted booking ID ${id} from JSON`);
      return deleted;
    }
  },

  // --- OAuth Tokens ---
  async saveUserTokens(email, tokens) {
    const { access_token, refresh_token, expiry_date } = tokens;
    const updated_at = new Date().toISOString();

    if (useMongo) {
      const existing = await db.collection('tokens').findOne({ email }) || {};
      const finalRefreshToken = refresh_token || existing.refresh_token || null;

      const tokenDoc = {
        email,
        access_token,
        refresh_token: finalRefreshToken,
        expiry_date: expiry_date || null,
        updated_at
      };

      await db.collection('tokens').updateOne({ email }, { $set: tokenDoc }, { upsert: true });
      console.log(`[DB] Saved OAuth tokens for: ${email} in MongoDB`);
      return tokenDoc;
    } else {
      const allTokens = readJSON(tokensPath);
      const existing = allTokens[email] || {};
      const finalRefreshToken = refresh_token || existing.refresh_token || null;

      allTokens[email] = {
        email,
        access_token,
        refresh_token: finalRefreshToken,
        expiry_date: expiry_date || null,
        updated_at
      };

      writeJSON(tokensPath, allTokens);
      console.log(`[DB] Saved OAuth tokens for: ${email} in JSON`);
      return allTokens[email];
    }
  },

  async getUserTokens(email) {
    if (useMongo) {
      return await db.collection('tokens').findOne({ email });
    } else {
      const allTokens = readJSON(tokensPath);
      return allTokens[email] || null;
    }
  },

  async deleteUserTokens(email) {
    if (useMongo) {
      const res = await db.collection('tokens').deleteOne({ email });
      console.log(`[DB] Deleted OAuth tokens for: ${email} from MongoDB`);
      return res.deletedCount > 0;
    } else {
      const allTokens = readJSON(tokensPath);
      if (!allTokens[email]) return false;

      delete allTokens[email];
      writeJSON(tokensPath, allTokens);
      console.log(`[DB] Deleted OAuth tokens for: ${email} from JSON`);
      return true;
    }
  },

  // --- Students ---
  async getAllStudents() {
    if (useMongo) {
      return await db.collection('students').find({}).toArray();
    } else {
      return readJSON(studentsPath);
    }
  },

  async createStudent({ name, location, color, category, nickname, grade, enrolled_date, current_course, next_course, report, user_email, is_hidden }) {
    let newId;
    if (useMongo) {
      const maxDoc = await db.collection('students').find().sort({ id: -1 }).limit(1).next();
      newId = maxDoc ? maxDoc.id + 1 : 1;
    } else {
      const students = readJSON(studentsPath);
      const maxId = students.reduce((max, s) => s.id > max ? s.id : max, 0);
      newId = maxId + 1;
    }

    const targetCategory = category || 'งานสอน';
    const newStudent = {
      id: newId,
      name,
      location: location || '',
      color: color || 'hsl(260, 85%, 65%)',
      category: targetCategory,
      nickname: nickname || '',
      grade: grade || '',
      enrolled_date: enrolled_date || '',
      current_course: current_course || '',
      next_course: next_course || '',
      report: report || '',
      is_hidden: is_hidden !== undefined ? !!is_hidden : false,
      user_email: user_email || null,
      created_at: new Date().toISOString()
    };

    if (useMongo) {
      await db.collection('students').insertOne(newStudent);
    } else {
      const students = readJSON(studentsPath);
      students.push(newStudent);
      writeJSON(studentsPath, students);
    }
    console.log(`[DB] Created student ID ${newId}: ${name} (${targetCategory})`);
    return newStudent;
  },

  async deleteStudent(id) {
    if (useMongo) {
      const existing = await db.collection('students').findOne({ id: Number(id) });
      if (!existing) return false;

      await db.collection('students').deleteOne({ id: Number(id) });
      console.log(`[DB] Deleted student ID ${id} from MongoDB`);
      return existing;
    } else {
      const students = readJSON(studentsPath);
      const index = students.findIndex(s => s.id === Number(id));
      if (index === -1) return false;

      const [deleted] = students.splice(index, 1);
      writeJSON(studentsPath, students);
      console.log(`[DB] Deleted student ID ${id} from JSON`);
      return deleted;
    }
  },

  async updateStudent(id, { name, location, color, category, nickname, grade, enrolled_date, current_course, next_course, report, is_hidden }) {
    if (useMongo) {
      const existing = await db.collection('students').findOne({ id: Number(id) });
      if (!existing) return null;

      const updatedStudent = {
        ...existing,
        name: name !== undefined ? name : existing.name,
        location: location !== undefined ? location : existing.location,
        color: color !== undefined ? color : existing.color,
        category: category !== undefined ? category : existing.category,
        nickname: nickname !== undefined ? nickname : (existing.nickname || ''),
        grade: grade !== undefined ? grade : (existing.grade || ''),
        enrolled_date: enrolled_date !== undefined ? enrolled_date : (existing.enrolled_date || ''),
        current_course: current_course !== undefined ? current_course : (existing.current_course || ''),
        next_course: next_course !== undefined ? next_course : (existing.next_course || ''),
        report: report !== undefined ? report : (existing.report || ''),
        is_hidden: is_hidden !== undefined ? !!is_hidden : (existing.is_hidden || false),
        updated_at: new Date().toISOString()
      };

      await db.collection('students').updateOne({ id: Number(id) }, { $set: updatedStudent });
      console.log(`[DB] Updated student ID ${id} in MongoDB`);
      return updatedStudent;
    } else {
      const students = readJSON(studentsPath);
      const index = students.findIndex(s => s.id === Number(id));
      if (index === -1) return null;

      students[index] = {
        ...students[index],
        name: name !== undefined ? name : students[index].name,
        location: location !== undefined ? location : students[index].location,
        color: color !== undefined ? color : students[index].color,
        category: category !== undefined ? category : students[index].category,
        nickname: nickname !== undefined ? nickname : (students[index].nickname || ''),
        grade: grade !== undefined ? grade : (students[index].grade || ''),
        enrolled_date: enrolled_date !== undefined ? enrolled_date : (students[index].enrolled_date || ''),
        current_course: current_course !== undefined ? current_course : (students[index].current_course || ''),
        next_course: next_course !== undefined ? next_course : (students[index].next_course || ''),
        report: report !== undefined ? report : (students[index].report || ''),
        is_hidden: is_hidden !== undefined ? !!is_hidden : (students[index].is_hidden || false),
        updated_at: new Date().toISOString()
      };

      writeJSON(studentsPath, students);
      console.log(`[DB] Updated student ID ${id} in JSON`);
      return students[index];
    }
  },

  // --- Categories ---
  async getAllCategories() {
    if (useMongo) {
      const docs = await db.collection('categories').find({}).toArray();
      return docs.map(d => d.name);
    } else {
      return readJSON(categoriesPath);
    }
  },

  async createCategory(name) {
    const trimmed = name.trim();
    if (!trimmed) return null;

    if (useMongo) {
      const existing = await db.collection('categories').findOne({ name: trimmed });
      if (existing) return trimmed;

      await db.collection('categories').insertOne({ name: trimmed });
      console.log(`[DB] Created category: ${trimmed} in MongoDB`);
      return trimmed;
    } else {
      const categories = readJSON(categoriesPath);
      if (categories.includes(trimmed)) return trimmed;
      categories.push(trimmed);
      writeJSON(categoriesPath, categories);
      console.log(`[DB] Created category: ${trimmed} in JSON`);
      return trimmed;
    }
  },

  async updateCategory(oldName, newName) {
    const trimmedNewName = newName.trim();

    if (useMongo) {
      // Update categories collection
      await db.collection('categories').updateOne({ name: oldName }, { $set: { name: trimmedNewName } });

      // Update students
      const studentRes = await db.collection('students').updateMany(
        { category: oldName },
        { $set: { category: trimmedNewName, updated_at: new Date().toISOString() } }
      );

      // Update bookings
      const bookingRes = await db.collection('bookings').updateMany(
        { class_name: oldName },
        { $set: { class_name: trimmedNewName, updated_at: new Date().toISOString() } }
      );

      console.log(`[DB] Updated category from "${oldName}" to "${trimmedNewName}" in MongoDB`);
      return { success: true, studentsUpdated: studentRes.modifiedCount, bookingsUpdated: bookingRes.modifiedCount };
    } else {
      const categories = readJSON(categoriesPath);
      const catIndex = categories.indexOf(oldName);
      if (catIndex !== -1) {
        categories[catIndex] = trimmedNewName;
        writeJSON(categoriesPath, categories);
      }

      const students = readJSON(studentsPath);
      let studentsUpdated = 0;
      const updatedStudents = students.map(s => {
        if ((s.category || 'งานสอน') === oldName) {
          studentsUpdated++;
          return { ...s, category: trimmedNewName, updated_at: new Date().toISOString() };
        }
        return s;
      });
      if (studentsUpdated > 0) {
        writeJSON(studentsPath, updatedStudents);
      }

      const bookings = readJSON(bookingsPath);
      let bookingsUpdated = 0;
      const updatedBookings = bookings.map(b => {
        if ((b.class_name || 'งานสอน') === oldName) {
          bookingsUpdated++;
          return { ...b, class_name: trimmedNewName, updated_at: new Date().toISOString() };
        }
        return b;
      });
      if (bookingsUpdated > 0) {
        writeJSON(bookingsPath, updatedBookings);
      }

      console.log(`[DB] Updated category from "${oldName}" to "${trimmedNewName}" in JSON`);
      return { success: true, studentsUpdated, bookingsUpdated };
    }
  },

  async deleteCategory(name) {
    if (useMongo) {
      await db.collection('categories').deleteOne({ name });
      const studentRes = await db.collection('students').deleteMany({ category: name });
      const bookingRes = await db.collection('bookings').deleteMany({ class_name: name });

      console.log(`[DB] Deleted category "${name}" from MongoDB`);
      return { success: true, studentsDeleted: studentRes.deletedCount, bookingsDeleted: bookingRes.deletedCount };
    } else {
      const categories = readJSON(categoriesPath);
      const filteredCategories = categories.filter(c => c !== name);
      writeJSON(categoriesPath, filteredCategories);

      const students = readJSON(studentsPath);
      const filteredStudents = students.filter(s => (s.category || 'งานสอน') !== name);
      const studentsDeleted = students.length - filteredStudents.length;
      writeJSON(studentsPath, filteredStudents);

      const bookings = readJSON(bookingsPath);
      const filteredBookings = bookings.filter(b => (b.class_name || 'งานสอน') !== name);
      const bookingsDeleted = bookings.length - filteredBookings.length;
      writeJSON(bookingsPath, filteredBookings);

      console.log(`[DB] Deleted category "${name}" in JSON`);
      return { success: true, studentsDeleted, bookingsDeleted };
    }
  },

  // --- Topics ---
  async getAllTopics() {
    if (useMongo) {
      const docs = await db.collection('topics').find({}).toArray();
      return docs.map(d => d.name);
    } else {
      return readJSON(topicsPath);
    }
  },

  async createTopic(name) {
    const trimmed = name.trim();
    if (!trimmed) return null;

    if (useMongo) {
      const existing = await db.collection('topics').findOne({ name: { $regex: new RegExp(`^${trimmed}$`, 'i') } });
      if (existing) return existing.name;

      await db.collection('topics').insertOne({ name: trimmed });
      console.log(`[DB] Created topic: ${trimmed} in MongoDB`);
      return trimmed;
    } else {
      const topics = readJSON(topicsPath);
      const exists = topics.some(t => t.toLowerCase() === trimmed.toLowerCase());
      if (exists) return trimmed;
      topics.push(trimmed);
      writeJSON(topicsPath, topics);
      console.log(`[DB] Created topic: ${trimmed} in JSON`);
      return trimmed;
    }
  },

  async deleteTopic(name) {
    const trimmed = name.trim();
    if (useMongo) {
      await db.collection('topics').deleteOne({ name: { $regex: new RegExp(`^${trimmed}$`, 'i') } });
      console.log(`[DB] Deleted topic: ${trimmed} from MongoDB`);
      return true;
    } else {
      const topics = readJSON(topicsPath);
      const filtered = topics.filter(t => t.toLowerCase() !== trimmed.toLowerCase());
      writeJSON(topicsPath, filtered);
      console.log(`[DB] Deleted topic: ${trimmed} from JSON`);
      return true;
    }
  },

  async updateTopic(oldName, newName) {
    const trimmedOld = oldName.trim();
    const trimmedNew = newName.trim();

    if (useMongo) {
      await db.collection('topics').updateOne(
        { name: { $regex: new RegExp(`^${trimmedOld}$`, 'i') } },
        { $set: { name: trimmedNew } }
      );
      console.log(`[DB] Updated topic from "${trimmedOld}" to "${trimmedNew}" in MongoDB`);
      return trimmedNew;
    } else {
      const topics = readJSON(topicsPath);
      const index = topics.findIndex(t => t.toLowerCase() === trimmedOld.toLowerCase());
      if (index === -1) return null;

      topics[index] = trimmedNew;
      writeJSON(topicsPath, topics);
      console.log(`[DB] Updated topic from "${trimmedOld}" to "${trimmedNew}" in JSON`);
      return trimmedNew;
    }
  },

  // --- Restore Backup ---
  async restoreBackup(data) {
    if (!data) throw new Error('No data provided');
    const { bookings, students, topics, categories } = data;

    if (useMongo) {
      if (Array.isArray(bookings)) {
        await db.collection('bookings').deleteMany({});
        if (bookings.length > 0) await db.collection('bookings').insertMany(bookings);
      }
      if (Array.isArray(students)) {
        await db.collection('students').deleteMany({});
        if (students.length > 0) await db.collection('students').insertMany(students);
      }
      if (Array.isArray(topics)) {
        await db.collection('topics').deleteMany({});
        if (topics.length > 0) {
          const topicDocs = topics.map(t => typeof t === 'string' ? { name: t } : t);
          await db.collection('topics').insertMany(topicDocs);
        }
      }
      if (Array.isArray(categories)) {
        await db.collection('categories').deleteMany({});
        if (categories.length > 0) {
          const catDocs = categories.map(c => typeof c === 'string' ? { name: c } : c);
          await db.collection('categories').insertMany(catDocs);
        }
      }
      console.log(`[DB] Restored backup in MongoDB`);
    } else {
      if (Array.isArray(bookings)) {
        writeJSON(bookingsPath, bookings);
      }
      if (Array.isArray(students)) {
        writeJSON(studentsPath, students);
      }
      if (Array.isArray(topics)) {
        writeJSON(topicsPath, topics);
      }
      if (Array.isArray(categories)) {
        writeJSON(categoriesPath, categories);
      }
      console.log(`[DB] Restored backup in JSON`);
    }

    return {
      success: true,
      bookingsCount: bookings?.length || 0,
      studentsCount: students?.length || 0,
      topicsCount: topics?.length || 0,
      categoriesCount: categories?.length || 0
    };
  },

  // --- Token-based Session Management ---
  async saveSession(token, userProfile) {
    if (useMongo) {
      await db.collection('sessions').updateOne(
        { token },
        { $set: { token, user: userProfile, createdAt: Date.now() } },
        { upsert: true }
      );
      console.log(`[DB] Session saved for token: ${token.substring(0, 8)}... in MongoDB`);
    } else {
      const sessions = readJSON(sessionsPath) || {};
      sessions[token] = { user: userProfile, createdAt: Date.now() };
      writeJSON(sessionsPath, sessions);
      console.log(`[DB] Session saved for token: ${token.substring(0, 8)}... in JSON`);
    }
  },

  async getSession(token) {
    if (!token) return null;
    const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

    if (useMongo) {
      const entry = await db.collection('sessions').findOne({ token });
      if (!entry) return null;

      if (Date.now() - entry.createdAt > THIRTY_DAYS) {
        await db.collection('sessions').deleteOne({ token });
        return null;
      }
      return entry.user;
    } else {
      const sessions = readJSON(sessionsPath) || {};
      const entry = sessions[token];
      if (!entry) return null;

      if (Date.now() - entry.createdAt > THIRTY_DAYS) {
        delete sessions[token];
        writeJSON(sessionsPath, sessions);
        return null;
      }
      return entry.user;
    }
  },

  async deleteSession(token) {
    if (!token) return;
    if (useMongo) {
      await db.collection('sessions').deleteOne({ token });
      console.log(`[DB] Session deleted for token: ${token.substring(0, 8)}... from MongoDB`);
    } else {
      const sessions = readJSON(sessionsPath) || {};
      if (sessions[token]) {
        delete sessions[token];
        writeJSON(sessionsPath, sessions);
        console.log(`[DB] Session deleted for token: ${token.substring(0, 8)}... from JSON`);
      }
    }
  },

  isMongoDB() {
    return useMongo;
  }
};











































