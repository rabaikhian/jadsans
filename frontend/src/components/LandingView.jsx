import React from 'react';
import { CalendarRange, Sparkles, ShieldCheck, Users, Clock, ArrowRight, CheckCircle2, ChevronRight, LogIn } from 'lucide-react';

export default function LandingView({ onViewSchedule, onTeacherPortal }) {
  return (
    <div 
      style={{ 
        minHeight: '100vh', 
        height: '100vh', 
        width: '100%', 
        background: '#fafafc',
        backgroundImage: 'radial-gradient(rgba(16, 185, 129, 0.08) 1.2px, transparent 1.2px), radial-gradient(rgba(99, 102, 241, 0.05) 1.2px, #fafafc 1.2px)',
        backgroundSize: '24px 24px',
        backgroundPosition: '0 0, 12px 12px',
        fontFamily: 'inherit',
        color: '#1e293b',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <style>{`
        @keyframes float-slow {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(1.5deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        @keyframes float-reverse {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(12px) rotate(-1.5deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        @keyframes blob-drift {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, -20px) scale(1.05); }
        }
        @media (max-width: 1024px) {
          .floating-decor-left, .floating-decor-right {
            display: none !important;
          }
        }
      `}</style>

      {/* Decorative Blob 1 */}
      <div style={{
        position: 'absolute',
        top: '-150px',
        left: '-150px',
        width: '550px',
        height: '550px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, transparent 70%)',
        filter: 'blur(80px)',
        pointerEvents: 'none',
        zIndex: 0,
        animation: 'blob-drift 12s infinite ease-in-out'
      }} />

      {/* Decorative Blob 2 */}
      <div style={{
        position: 'absolute',
        top: '25%',
        right: '-150px',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%)',
        filter: 'blur(85px)',
        pointerEvents: 'none',
        zIndex: 0,
        animation: 'blob-drift 16s infinite ease-in-out reverse'
      }} />

      {/* Decorative Blob 3 */}
      <div style={{
        position: 'absolute',
        bottom: '-150px',
        left: '20%',
        width: '600px',
        height: '600px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(236, 72, 153, 0.04) 0%, transparent 70%)',
        filter: 'blur(90px)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* Giant Blurred Background Calendar Grid Watermark */}
      <div style={{
        position: 'absolute',
        top: '12%',
        left: '50%',
        transform: 'translateX(-50%) rotate(-10deg) scale(1.35)',
        width: '120%',
        maxWidth: '1400px',
        height: '680px',
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gridTemplateRows: 'repeat(5, 1fr)',
        gap: '24px',
        opacity: '0.07', // High visibility blurred watermark
        pointerEvents: 'none',
        zIndex: 0,
        filter: 'blur(2.2px)', // Faded & Blurred calendar grid watermark
        boxSizing: 'border-box',
        padding: '20px'
      }}>
        {Array.from({ length: 35 }).map((_, idx) => {
          const hasBlock = idx === 3 || idx === 8 || idx === 12 || idx === 19 || idx === 23 || idx === 27;
          const blockColor = idx % 3 === 0 ? 'var(--primary)' : idx % 3 === 1 ? 'var(--secondary)' : '#ec4899';
          return (
            <div 
              key={idx}
              style={{
                border: '1.5px solid rgba(16, 185, 129, 0.22)', // Clear emerald border lines
                borderRadius: '20px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                boxSizing: 'border-box',
                background: 'rgba(255, 255, 255, 0.55)'
              }}
            >
              <span style={{ fontSize: '1.4rem', fontWeight: '900', color: '#0f172a', opacity: 0.15 }}>
                {idx + 1}
              </span>
              {hasBlock && (
                <div style={{
                  height: '28px',
                  background: blockColor,
                  borderRadius: '10px',
                  marginTop: '16px',
                  width: '100%',
                  opacity: 0.4
                }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Floating Widget 1 - Left Side */}
      <div 
        style={{
          position: 'absolute',
          top: '35%',
          left: '6%',
          zIndex: 1,
          animation: 'float-slow 8s infinite ease-in-out',
          pointerEvents: 'none'
        }}
        className="floating-decor-left"
      >
        <div style={{
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(16, 185, 129, 0.15)',
          padding: '12px 18px',
          borderRadius: '16px',
          boxShadow: '0 10px 30px rgba(16, 185, 129, 0.06)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
            <CheckCircle2 size={16} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#1e293b' }}>Google Calendar</span>
            <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: '500' }}>Live Synced successfully ✓</span>
          </div>
        </div>
      </div>

      {/* Floating Widget 2 - Right Side */}
      <div 
        style={{
          position: 'absolute',
          top: '48%',
          right: '6%',
          zIndex: 1,
          animation: 'float-reverse 9s infinite ease-in-out',
          pointerEvents: 'none'
        }}
        className="floating-decor-right"
      >
        <div style={{
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(99, 102, 241, 0.15)',
          padding: '12px 18px',
          borderRadius: '16px',
          boxShadow: '0 10px 30px rgba(99, 102, 241, 0.06)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}>
            <Clock size={16} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#1e293b' }}>Math Lesson</span>
            <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: '500' }}>14:00 - 15:30 today</span>
          </div>
        </div>
      </div>
      {/* Header / Navbar */}
      <header 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          padding: '12px 40px', // Squeezed header padding
          maxWidth: '1200px', 
          width: '100%', 
          margin: '0 auto', 
          boxSizing: 'border-box',
          position: 'relative',
          zIndex: 2
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div 
            style={{ 
              width: '38px', 
              height: '38px', 
              borderRadius: '10px', 
              background: 'var(--gradient-emerald)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
            }}
          >
            <CalendarRange size={20} />
          </div>
          <span style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em' }}>
            StudentScheduler
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            onClick={onTeacherPortal}
            style={{
              background: 'transparent',
              color: '#475569',
              border: '1.5px solid #cbd5e1',
              padding: '9px 18px',
              borderRadius: '12px',
              fontSize: '0.85rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#f1f5f9';
              e.currentTarget.style.color = '#0f172a';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#475569';
            }}
          >
            Login
          </button>

          <button 
            onClick={onViewSchedule}
            className="action-btn"
            style={{
              background: 'var(--gradient-emerald)',
              color: '#ffffff',
              border: 'none',
              padding: '10px 18px',
              borderRadius: '12px',
              fontSize: '0.85rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.2)',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.25)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = '0 4px 14px rgba(16, 185, 129, 0.2)';
            }}
          >
            Browse Demo
            <ArrowRight size={14} />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section 
        style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          textAlign: 'center', 
          padding: '10px 24px', // Squeezed hero padding
          maxWidth: '800px', 
          width: '100%', 
          margin: '0 auto', 
          boxSizing: 'border-box',
          position: 'relative',
          zIndex: 2
        }}
      >
        {/* Animated tag */}
        <div 
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '8px', 
            background: 'rgba(16, 185, 129, 0.08)', 
            border: '1px solid rgba(16, 185, 129, 0.15)', 
            padding: '6px 14px', 
            borderRadius: '99px',
            color: '#047857',
            fontSize: '0.75rem',
            fontWeight: '700',
            marginBottom: '16px', // Squeezed tag margin
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6)',
            animation: 'fadeIn 0.6s ease'
          }}
        >
          <Sparkles size={13} />
          <span>Automated Student Booking Console v2.0</span>
        </div>

        <h1 
          style={{ 
            fontSize: '3.1rem', // Compact title font
            fontWeight: '900', 
            color: '#0f172a', 
            lineHeight: '1.15', 
            margin: '0 0 12px 0', 
            letterSpacing: '-0.03em',
            backgroundImage: 'linear-gradient(135deg, #0f172a 60%, #10b981 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          Streamline Student Booking & Live Calendar Syncing
        </h1>

        <p 
          style={{ 
            fontSize: '1.02rem', // Compact body font
            color: '#64748b', 
            lineHeight: '1.5', 
            margin: '0 0 24px 0', // Squeezed paragraph margin
            maxWidth: '650px' 
          }}
        >
          The ultimate scheduling workflow for professional teachers and tutors. 
          Manage dossiers, assignments, and share real-time booking slots safely with parents.
        </p>

        {/* Hero Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button 
            onClick={onViewSchedule}
            style={{
              background: 'var(--gradient-emerald)',
              color: '#ffffff',
              border: 'none',
              padding: '16px 28px',
              borderRadius: '16px',
              fontSize: '1rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.3), 0 8px 10px -6px rgba(16, 185, 129, 0.3)',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 15px 30px -5px rgba(16, 185, 129, 0.35), 0 10px 15px -6px rgba(16, 185, 129, 0.35)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(16, 185, 129, 0.3), 0 8px 10px -6px rgba(16, 185, 129, 0.3)';
            }}
          >
            Browse Demo
            <ArrowRight size={18} />
          </button>


        </div>

        {/* Dynamic Mock Calendar Preview card */}
        <div 
          className="glass-card" 
          style={{ 
            marginTop: '28px', // Compact card margin
            width: '100%', 
            borderRadius: '24px', 
            padding: '16px', // Compact padding
            border: '1px solid rgba(16, 185, 129, 0.1)',
            boxShadow: '0 20px 45px -10px rgba(0,0,0,0.06)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(12px)',
            transform: 'perspective(1000px) rotateX(2deg)',
            transformOrigin: 'top center'
          }}
        >
          {/* Mock App header row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} />
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }} />
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
            </div>
            <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: '500' }}>http://localhost:5173/grid-preview</span>
            <div style={{ width: '28px' }} />
          </div>
          
          {/* Mock mini layout rows */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', padding: '6px 0' }}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
              <span key={idx} style={{ fontSize: '0.65rem', fontWeight: '700', color: '#94a3b8' }}>{day}</span>
            ))}
            {Array.from({ length: 14 }).map((_, idx) => {
              const isEvent = idx === 3 || idx === 7 || idx === 10;
              return (
                <div 
                  key={idx} 
                  style={{ 
                    height: '36px', // Compact cell height
                    borderRadius: '8px', 
                    background: isEvent ? 'rgba(16, 185, 129, 0.08)' : '#f8fafc',
                    border: isEvent ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid #f1f5f9',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative'
                  }}
                >
                  <span style={{ fontSize: '0.6rem', fontWeight: '700', color: '#64748b', position: 'absolute', top: '3px', left: '5px' }}>{idx + 15}</span>
                  {isEvent && (
                    <div style={{ width: '80%', height: '10px', background: 'var(--gradient-emerald)', borderRadius: '3px', marginTop: '10px', boxShadow: '0 2px 4px rgba(16,185,129,0.1)' }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

    </div>
  );
}
