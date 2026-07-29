import React, { useState, useEffect } from 'react';
import { Calendar, Users, LogIn, LogOut, Loader2, Sparkles, Clock, GraduationCap } from 'lucide-react';
import BookingView from './components/BookingView';
import MasterView from './components/MasterView';
import TodayTasksView from './components/TodayTasksView';
import StudentProfilesView from './components/StudentProfilesView';
import LoginView from './components/LoginView';
import LandingView from './components/LandingView';
import { getDemoStudents, getDemoBookings } from './utils/demoData';
import { apiFetch } from './api';

export default function App() {
  const urlParams = new URLSearchParams(window.location.search);
  const isSharedParam = urlParams.get('shared') === 'true';

  const [activeView, setActiveView] = useState(() => {
    const path = window.location.pathname;
    if (path === '/login') return 'login';
    if (path.startsWith('/dashboard/')) {
      const view = path.substring(11);
      if (view === 'master' || view === 'today' || view === 'booking' || view === 'students') {
        return view;
      }
    }
    if (path.startsWith('/demo/')) {
      const view = path.substring(6);
      if (view === 'master' || view === 'today' || view === 'booking' || view === 'students') {
        return view;
      }
    }
    const params = new URLSearchParams(window.location.search);
    return params.get('shared') === 'true' ? 'master' : 'landing';
  }); // Default landing based on path and shared query

  const changeView = (view, forceDemo = false) => {
    let path = '/';
    if (view === 'login') {
      path = '/login';
    } else if (view !== 'landing') {
      const isDemoMode = forceDemo || user?.isDemo || window.location.pathname.startsWith('/demo/');
      const prefix = isDemoMode ? '/demo/' : '/dashboard/';
      path = prefix + view;
    }
    const search = window.location.search;
    window.history.pushState({}, '', path + search);
    setActiveView(view);
  };
  const [user, setUser] = useState(null);
  const [isMockMode, setIsMockMode] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [students, setStudents] = useState([]);
  const [categories, setCategories] = useState(['งานสอน']);
  const [authLoading, setAuthLoading] = useState(true);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  const effectiveUser = isSharedParam ? null : user;

  const fetchStudents = async () => {
    if (user?.isDemo) {
      const demo = getDemoStudents();
      setStudents(demo);
      return demo;
    }
    try {
      const response = await apiFetch('/api/students' + window.location.search);
      if (response.ok) {
        const data = await response.json();
        setStudents(data);
        return data;
      }
    } catch (err) {
      console.error('Error fetching students:', err);
    }
    return null;
  };

  const fetchCategories = async () => {
    if (user?.isDemo) {
      const demo = ['งานสอน'];
      setCategories(demo);
      return demo;
    }
    try {
      const response = await apiFetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
        return data;
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
    return null;
  };

  useEffect(() => {
    fetchStudents();
    fetchCategories();
  }, []);

  // Listen to browser popstate (back/forward navigation)
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/login') {
        setActiveView('login');
      } else if (path.startsWith('/dashboard/')) {
        const view = path.substring(11);
        if (view === 'master' || view === 'today' || view === 'booking' || view === 'students') {
          setActiveView(view);
        }
      } else if (path.startsWith('/demo/')) {
        const view = path.substring(6);
        if (view === 'master' || view === 'today' || view === 'booking' || view === 'students') {
          setActiveView(view);
        }
      } else {
        const params = new URLSearchParams(window.location.search);
        setActiveView(params.get('shared') === 'true' ? 'master' : 'landing');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Force 'landing' or 'master' view if not logged in
  useEffect(() => {
    if (!effectiveUser && activeView !== 'landing' && activeView !== 'master' && activeView !== 'login') {
      changeView('landing');
    }
  }, [effectiveUser, activeView]);

  // Check user authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (window.location.pathname.startsWith('/demo/')) {
        setUser({
          email: 'demo@student-scheduler.com',
          name: 'Demo Visitor',
          picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120',
          isDemo: true
        });
        setAuthLoading(false);
        return;
      }
      try {
        const response = await apiFetch('/auth/status');
        const data = await response.json();
        if (data.authenticated) {
          setUser(data.user);
          if (window.location.pathname === '/') {
            changeView('master');
          }
        } else {
          setUser(null);
        }
        setIsMockMode(data.isMockMode);
      } catch (err) {
        console.error('Error fetching auth status:', err);
      } finally {
        setAuthLoading(false);
      }
    };
    checkAuth();
  }, []);

  // Fetch bookings list (can be called to refresh data)
  const fetchBookings = async () => {
    setBookingsLoading(true);
    if (user?.isDemo) {
      const demo = getDemoBookings();
      setBookings(demo);
      setBookingsLoading(false);
      return demo;
    }
    try {
      const response = await apiFetch('/api/bookings' + window.location.search);
      if (response.ok) {
        const data = await response.json();
        setBookings(data);
        return data;
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setBookingsLoading(false);
    }
    return null;
  };

  const checkAndAutoRestore = async (fetchedBookings, fetchedStudents, fetchedCategories) => {
    // Don't auto-restore if anonymous visitor or in demo mode
    const activeEmail = user?.email;
    if (!activeEmail || user?.isDemo) return;

    // A wiped database has 0 bookings and 0 students
    const isBackendEmpty = 
      Array.isArray(fetchedBookings) && fetchedBookings.length === 0 && 
      Array.isArray(fetchedStudents) && fetchedStudents.length === 0;
      
    if (!isBackendEmpty) return;

    // Retrieve cached backup from local storage
    const cacheStr = localStorage.getItem(`jadsans_auto_backup_${activeEmail}`);
    if (!cacheStr) return;

    try {
      const cachedData = JSON.parse(cacheStr);
      if (cachedData && (cachedData.bookings?.length > 0 || cachedData.students?.length > 0)) {
        console.log('[Auto-Restore] Ephemeral wipe detected. Silently restoring from browser cache for:', activeEmail);
        
        const res = await apiFetch('/api/restore', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cachedData)
        });

        if (res.ok) {
          console.log('[Auto-Restore] Silent restore successful!');
          // Re-fetch everything
          await fetchBookings();
          await fetchStudents();
          await fetchCategories();
        }
      }
    } catch (err) {
      console.error('[Auto-Restore] Failed to parse or restore from cache:', err);
    }
  };

  // Auto-backup caching hook scoped per teacher account
  useEffect(() => {
    const activeEmail = user?.email;
    if (activeEmail && !user.isDemo && (bookings.length > 0 || students.length > 0)) {
      const backupData = {
        bookings,
        students,
        categories
      };
      localStorage.setItem(`jadsans_auto_backup_${activeEmail}`, JSON.stringify(backupData));
    }
  }, [bookings, students, categories, user]);

  // Fetch bookings initially and whenever views swap, syncing auth status
  useEffect(() => {
    const syncAuthAndFetch = async () => {
      let isAuthed = false;
      try {
        if (user?.isDemo) {
          fetchBookings();
          fetchStudents();
          fetchCategories();
          return;
        }
        const response = await apiFetch('/auth/status');
        if (response.ok) {
          const data = await response.json();
          if (data.authenticated) {
            setUser(data.user);
            isAuthed = true;
          } else {
            setUser(null);
          }
          setIsMockMode(data.isMockMode);
        }
      } catch (err) {
        console.error('Error syncing auth status:', err);
      }
      
      const bData = await fetchBookings();
      const sData = await fetchStudents();
      const cData = await fetchCategories();

      if (isAuthed && bData && sData) {
        await checkAndAutoRestore(bData, sData, cData);
      }
    };
    syncAuthAndFetch();
  }, [activeView, user?.isDemo, user?.email]);


  const handleLogin = () => {
    changeView('login');
  };

  const handleLogout = async () => {
    if (user?.isDemo) {
      setUser(null);
      changeView('landing');
      return;
    }
    try {
      const response = await apiFetch('/auth/logout', { method: 'POST' });
      if (response.ok) {
        setUser(null);
        changeView('landing');
      }
    } catch (err) {
      console.error('Error during logout:', err);
    }
  };

  if (activeView === 'landing') {
    return (
      <LandingView 
        onViewSchedule={() => {
          setUser({
            email: 'demo@student-scheduler.com',
            name: 'Demo Visitor',
            picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120',
            isDemo: true
          });
          changeView('master', true);
        }}
        onTeacherPortal={() => {
          changeView('login');
        }}
      />
    );
  }

  if (activeView === 'login') {
    return (
      <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoginView onBack={() => {
          const params = new URLSearchParams(window.location.search);
          changeView(params.get('shared') === 'true' ? 'master' : 'landing');
        }} />
      </div>
    );
  }

  return (
    <div className="app-container">
      {user?.isDemo && (
        <div style={{
          background: 'linear-gradient(135deg, #6366f1 0%, #10b981 100%)',
          color: '#ffffff',
          padding: '10px 20px',
          fontSize: '0.82rem',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          boxShadow: 'var(--shadow-sm)',
          flexShrink: 0,
          textAlign: 'center',
          animation: 'slideDown 0.3s ease'
        }}>
          <span>💡 Demo Mode: You are previewing the full administrative system. Actions are read-only.</span>
          <button 
            onClick={() => {
              setUser(null);
              window.history.pushState({}, '', '/');
              setActiveView('landing');
            }}
            style={{
              background: '#ffffff',
              color: '#4f46e5',
              border: 'none',
              padding: '4px 12px',
              borderRadius: '6px',
              fontSize: '0.74rem',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = 0.9}
            onMouseLeave={e => e.currentTarget.style.opacity = 1}
          >
            Exit Demo
          </button>
        </div>
      )}

      {/* Premium Header */}
      <header className="app-header">
        <div className="brand-section">
          <div className="brand-logo-glow">
            <Sparkles size={20} />
          </div>
          <div>
            <h1 className="brand-title">StudentScheduler</h1>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              v2.0 &bull; Google Calendar Integrated
            </span>
          </div>
        </div>

        <div className="nav-controls">
          {!isSharedParam && (
            <div className="view-tabs">
              <button
                className={`tab-btn ${activeView === 'master' ? 'active' : ''}`}
                onClick={() => changeView('master')}
              >
                <Calendar size={16} />
                Master Monthly Grid
              </button>
              {effectiveUser && (
                <>
                  <button
                    className={`tab-btn ${activeView === 'today' ? 'active' : ''}`}
                    onClick={() => changeView('today')}
                  >
                    <Clock size={16} />
                    Today's Tasks
                  </button>
                  <button
                    className={`tab-btn ${activeView === 'booking' ? 'active' : ''}`}
                    onClick={() => changeView('booking')}
                  >
                    <Sparkles size={16} />
                    Booking View
                  </button>
                  <button
                    className={`tab-btn ${activeView === 'students' ? 'active' : ''}`}
                    onClick={() => changeView('students')}
                  >
                    <GraduationCap size={16} />
                    Student Profiles
                  </button>
                </>
              )}
            </div>
          )}

          <div className="auth-status-container">
            {authLoading ? (
              <Loader2 className="animate-spin" size={20} color="var(--text-muted)" />
            ) : effectiveUser ? (
              <div className="user-profile-badge">
                {effectiveUser.picture ? (
                  <img src={effectiveUser.picture} alt={effectiveUser.name} className="user-avatar" />
                ) : (
                  <div className="user-avatar" style={{ background: 'var(--gradient-cosmic)' }} />
                )}
                <span className="user-name">{effectiveUser.name}</span>
                {isMockMode && (
                  <span style={{ fontSize: '0.65rem', background: '#3b82f6', color: '#fff', padding: '2px 6px', borderRadius: '4px', marginRight: '4px' }}>
                    Mock Sync
                  </span>
                )}
                <button onClick={handleLogout} className="logout-btn" title="Sign Out">
                  <LogOut size={16} />
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {/* Main Panel Content */}
      <main className="view-panel">
        {activeView === 'master' ? (
          <MasterView 
            bookings={bookings} 
            students={students}
            categories={categories}
            onStudentsChanged={fetchStudents}
            onCategoriesChanged={fetchCategories}
            loading={bookingsLoading}
            user={effectiveUser}
            onBookingsChanged={fetchBookings}
          />
        ) : activeView === 'today' ? (
          <TodayTasksView 
            bookings={bookings} 
            students={students}
            categories={categories}
            onBookingCreated={fetchBookings} 
            onCategoriesChanged={fetchCategories}
            user={effectiveUser}
          />
        ) : activeView === 'booking' ? (
          <BookingView 
            bookings={bookings} 
            students={students}
            categories={categories}
            onStudentsChanged={fetchStudents}
            onCategoriesChanged={fetchCategories}
            user={effectiveUser}
            onBookingCreated={fetchBookings} 
            onLoginRequested={handleLogin}
          />
        ) : (
          <StudentProfilesView 
            students={students}
            bookings={bookings}
            categories={categories}
            onStudentsChanged={fetchStudents}
            onCategoriesChanged={fetchCategories}
            user={effectiveUser}
          />
        )}
      </main>


    </div>
  );
}
