import React from 'react';
import { ArrowLeft, ShieldAlert, Sparkles, CalendarRange, HelpCircle } from 'lucide-react';
import { getAuthUrl } from '../api';

export default function LoginView({ onBack }) {
  const handleGoogleLogin = () => {
    // Redirect to backend OAuth route
    window.location.href = getAuthUrl('/auth/google');
  };

  return (
    <div 
      style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: 'calc(100vh - 120px)', 
        width: '100%',
        padding: '24px',
        boxSizing: 'border-box',
        background: 'radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.05) 0%, transparent 80%)'
      }}
    >
      <div 
        className="glass-card"
        style={{ 
          width: '100%', 
          maxWidth: '440px', 
          padding: '40px 32px', 
          borderRadius: '24px', 
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15), 0 0 40px rgba(16, 185, 129, 0.05)',
          background: '#ffffff',
          border: '1px solid rgba(16, 185, 129, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          animation: 'zoomIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Subtle decorative background blur shapes */}
        <div style={{ position: 'absolute', top: '-60px', left: '-60px', width: '120px', height: '120px', background: 'rgba(16, 185, 129, 0.1)', filter: 'blur(30px)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-60px', right: '-60px', width: '120px', height: '120px', background: 'rgba(99, 102, 241, 0.1)', filter: 'blur(30px)', borderRadius: '50%' }} />

        {/* Back navigation */}
        <button 
          onClick={onBack}
          style={{ 
            position: 'absolute', 
            top: '20px', 
            left: '20px', 
            background: 'none', 
            border: 'none', 
            color: 'var(--text-secondary)', 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px',
            fontSize: '0.8rem',
            fontWeight: '600',
            transition: 'color 0.15s'
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
        >
          <ArrowLeft size={16} />
          Calendar
        </button>

        {/* App Logo */}
        <div 
          style={{ 
            width: '60px', 
            height: '60px', 
            borderRadius: '16px', 
            background: 'var(--gradient-emerald)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            boxShadow: '0 8px 24px rgba(16, 185, 129, 0.25)', 
            color: '#ffffff',
            marginBottom: '20px',
            marginTop: '12px'
          }}
        >
          <CalendarRange size={28} />
        </div>

        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
          Teacher Portal
        </h2>
        <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 28px 0', lineHeight: '1.5' }}>
          Sign in using your Google account to manage class bookings, student profiles, and sync events directly with Google Calendar.
        </p>

        {/* Google OAuth Login Button */}
        <button
          onClick={handleGoogleLogin}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            padding: '14px 24px',
            borderRadius: '16px',
            border: '1px solid #dadce0',
            background: '#ffffff',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            width: '100%',
            outline: 'none',
            fontFamily: 'inherit',
            fontWeight: '600',
            fontSize: '0.95rem',
            color: '#3c4043',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
            boxSizing: 'border-box'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.borderColor = '#10b981';
            e.currentTarget.style.boxShadow = '0 8px 20px -6px rgba(16, 185, 129, 0.15), 0 0 0 3px rgba(16, 185, 129, 0.04)';
            e.currentTarget.style.background = '#fafafc';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.borderColor = '#dadce0';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)';
            e.currentTarget.style.background = '#ffffff';
          }}
        >
          {/* Official Google G Logo SVG */}
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
            <path d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.47h4.84c-.21 1.12-.84 2.07-1.79 2.7l2.79 2.16c1.63-1.5 2.8-3.73 2.8-6.49z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.47-.8 5.96-2.2l-2.79-2.16c-.78.52-1.78.83-3.17.83-2.44 0-4.51-1.65-5.25-3.87H.92v2.24A9.002 9.002 0 009 18z" fill="#34A853"/>
            <path d="M3.75 10.6A5.4 5.4 0 013.5 9c0-.56.1-1.1.25-1.6V5.16H.92a9.01 9.01 0 000 7.68l2.83-2.24z" fill="#FBBC05"/>
            <path d="M9 3.58c1.32 0 2.5.45 3.44 1.35L15 2.4C13.46.97 11.42 0 9 0 5.48 0 2.46 2.03.92 5.16l2.83 2.24C4.49 5.23 6.56 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          <span>Sign in with Google</span>
        </button>

        {/* Integration Status Badge */}
        <div 
          style={{ 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginTop: '24px',
            padding: '10px 14px',
            borderRadius: '12px',
            background: 'rgba(16, 185, 129, 0.06)',
            border: '1px solid rgba(16, 185, 129, 0.12)',
            width: '100%',
            boxSizing: 'border-box'
          }}
        >
          <Sparkles size={14} style={{ color: '#10b981', flexShrink: 0 }} />
          <span style={{ fontSize: '0.78rem', fontWeight: '600', color: '#047857', textAlign: 'left' }}>
            Live Google Calendar Sync Active
          </span>
        </div>

        {/* Footer Support Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '36px', color: '#94a3b8', fontSize: '0.72rem' }}>
          <HelpCircle size={13} />
          <span>Need help? Contact system administrator.</span>
        </div>
      </div>
    </div>
  );
}
