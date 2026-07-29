import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const bookingsPath = path.resolve(__dirname, 'bookings.json');
const tokensPath = path.resolve(__dirname, 'tokens.json');
const studentsPath = path.resolve(__dirname, 'students.json');
const topicsPath = path.resolve(__dirname, 'topics.json');
const categoriesPath = path.resolve(__dirname, 'categories.json');

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
initFile(categoriesPath, ["งานสอน", "งานประชุม", "งานประกัน", "งานนัดลูกค้า"]);

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

export const dbService = {
  // --- Bookings ---
  getAllBookings() {
    const bookings = readJSON(bookingsPath);
    // Sort by date ascending, then start_time ascending
    return bookings.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.start_time.localeCompare(b.start_time);
    });
  },

  getBookingById(id) {
    const bookings = readJSON(bookingsPath);
    return bookings.find(b => b.id === Number(id)) || null;
  },

  createBooking({ class_name, student_name, date, start_time, end_time, notes, color, location, class_type, google_event_id, status, user_email }) {
    const bookings = readJSON(bookingsPath);
    
    // Auto-increment ID calculation
    const maxId = bookings.reduce((max, b) => b.id > max ? b.id : max, 0);
    const newId = maxId + 1;

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

    bookings.push(newBooking);
    writeJSON(bookingsPath, bookings);
    console.log(`[DB] Created booking ID ${newId}`);
    return newBooking;
  },

  updateBooking(id, { class_name, student_name, date, start_time, end_time, notes, color, location, class_type, google_event_id, status }) {
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
    console.log(`[DB] Updated booking ID ${id}`);
    return bookings[index];
  },

  deleteBooking(id) {
    const bookings = readJSON(bookingsPath);
    const index = bookings.findIndex(b => b.id === Number(id));
    if (index === -1) return false;

    const [deleted] = bookings.splice(index, 1);
    writeJSON(bookingsPath, bookings);
    console.log(`[DB] Deleted booking ID ${id}`);
    return deleted;
  },

  // --- OAuth Tokens ---
  saveUserTokens(email, tokens) {
    const allTokens = readJSON(tokensPath);
    const { access_token, refresh_token, expiry_date } = tokens;
    
    const existing = allTokens[email] || {};
    const finalRefreshToken = refresh_token || existing.refresh_token || null;

    allTokens[email] = {
      email,
      access_token,
      refresh_token: finalRefreshToken,
      expiry_date: expiry_date || null,
      updated_at: new Date().toISOString()
    };

    writeJSON(tokensPath, allTokens);
    console.log(`[DB] Saved OAuth tokens for: ${email}`);
    return allTokens[email];
  },

  getUserTokens(email) {
    const allTokens = readJSON(tokensPath);
    return allTokens[email] || null;
  },

  deleteUserTokens(email) {
    const allTokens = readJSON(tokensPath);
    if (!allTokens[email]) return false;

    delete allTokens[email];
    writeJSON(tokensPath, allTokens);
    console.log(`[DB] Deleted OAuth tokens for: ${email}`);
    return true;
  },

  // --- Students ---
  getAllStudents() {
    return readJSON(studentsPath);
  },

  createStudent({ name, location, color, category, nickname, grade, enrolled_date, current_course, next_course, report, user_email, is_hidden }) {
    const students = readJSON(studentsPath);
    
    // Auto-increment ID calculation
    const maxId = students.reduce((max, s) => s.id > max ? s.id : max, 0);
    const newId = maxId + 1;

    const newStudent = {
      id: newId,
      name,
      location: location || '',
      color: color || 'hsl(260, 85%, 65%)',
      category: category || 'งานสอน',
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

    students.push(newStudent);
    writeJSON(studentsPath, students);
    console.log(`[DB] Created student ID ${newId}: ${name} (${category || 'งานสอน'})`);
    return newStudent;
  },

  deleteStudent(id) {
    const students = readJSON(studentsPath);
    const index = students.findIndex(s => s.id === Number(id));
    if (index === -1) return false;

    const [deleted] = students.splice(index, 1);
    writeJSON(studentsPath, students);
    console.log(`[DB] Deleted student ID ${id}`);
    return deleted;
  },

  updateStudent(id, { name, location, color, category, nickname, grade, enrolled_date, current_course, next_course, report, is_hidden }) {
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
    console.log(`[DB] Updated student ID ${id}`);
    return students[index];
  },

  getAllCategories() {
    return readJSON(categoriesPath);
  },

  createCategory(name) {
    const categories = readJSON(categoriesPath);
    const trimmed = name.trim();
    if (!trimmed) return null;
    if (categories.includes(trimmed)) return trimmed;
    categories.push(trimmed);
    writeJSON(categoriesPath, categories);
    console.log(`[DB] Created category: ${trimmed}`);
    return trimmed;
  },

  updateCategory(oldName, newName) {
    // Update in categories.json
    const categories = readJSON(categoriesPath);
    const catIndex = categories.indexOf(oldName);
    if (catIndex !== -1) {
      categories[catIndex] = newName;
      writeJSON(categoriesPath, categories);
    }

    const students = readJSON(studentsPath);
    let studentsUpdated = 0;
    const updatedStudents = students.map(s => {
      if ((s.category || 'งานสอน') === oldName) {
        studentsUpdated++;
        return { ...s, category: newName, updated_at: new Date().toISOString() };
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
        return { ...b, class_name: newName, updated_at: new Date().toISOString() };
      }
      return b;
    });
    if (bookingsUpdated > 0) {
      writeJSON(bookingsPath, updatedBookings);
    }

    console.log(`[DB] Updated category from "${oldName}" to "${newName}" (${studentsUpdated} students, ${bookingsUpdated} bookings)`);
    return { success: true, studentsUpdated, bookingsUpdated };
  },

  deleteCategory(name) {
    // Delete from categories.json
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

    console.log(`[DB] Deleted category "${name}" (${studentsDeleted} students, ${bookingsDeleted} bookings)`);
    return { success: true, studentsDeleted, bookingsDeleted };
  },

  // --- Topics ---
  getAllTopics() {
    return readJSON(topicsPath);
  },

  createTopic(name) {
    const topics = readJSON(topicsPath);
    const trimmed = name.trim();
    if (!trimmed) return null;
    
    // Check duplication case-insensitively
    const exists = topics.some(t => t.toLowerCase() === trimmed.toLowerCase());
    if (exists) return trimmed; // Return the existing item
    
    topics.push(trimmed);
    writeJSON(topicsPath, topics);
    console.log(`[DB] Created topic: ${trimmed}`);
    return trimmed;
  },

  deleteTopic(name) {
    const topics = readJSON(topicsPath);
    const filtered = topics.filter(t => t.toLowerCase() !== name.trim().toLowerCase());
    writeJSON(topicsPath, filtered);
    console.log(`[DB] Deleted topic: ${name}`);
    return true;
  },

  updateTopic(oldName, newName) {
    const topics = readJSON(topicsPath);
    const index = topics.findIndex(t => t.toLowerCase() === oldName.trim().toLowerCase());
    if (index === -1) return null;
    
    topics[index] = newName.trim();
    writeJSON(topicsPath, topics);
    console.log(`[DB] Updated topic from "${oldName}" to "${newName}"`);
    return newName.trim();
  }
};
