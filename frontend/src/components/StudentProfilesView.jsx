import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, Plus, Edit, Trash2, MapPin, Tag, X, ChevronDown, User, Sparkles, GraduationCap, Calendar, BookOpen, Layers, Check, Download, Image, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { toPng } from 'html-to-image';
import { apiFetch } from '../api';


const PASTEL_COLORS = [
  '#ffb3c6', '#ffc6ff', '#ffd1dc', '#ffcdd2', '#ffe5d9', '#ffdac1', '#ffd8be', '#ffe0b2',
  '#fff9db', '#fff5cc', '#fff9c4', '#f0f4c3', '#d8f3dc', '#d1fae5', '#c8e6c9', '#e8f5e9',
  '#e0f7fa', '#e0f2f1', '#b2dfdb', '#c7f9cc', '#e3f2fd', '#bbdefb', '#d0ebff', '#b3e5fc',
  '#ebd9fc', '#f3e8ff', '#e8def8', '#d1c4e9', '#f8bbd0', '#e1bee7', '#f0f4f8', '#e2e8f0'
];

// --- Local Custom Select Component ---
function CustomSelect({ value, onChange, options, placeholder, onDeleteOption, onEditOption, style = {} }) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);

  const toggleDropdown = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom,
        left: rect.left,
        width: rect.width
      });
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const updatePosition = () => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setCoords({
          top: rect.bottom,
          left: rect.left,
          width: rect.width
        });
      }
    };
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  const selectedOption = options.find(opt => {
    const val = opt.value !== undefined ? opt.value : opt;
    return val === value;
  });
  const displayLabel = selectedOption ? (selectedOption.label ?? selectedOption) : (placeholder || '-- เลือก --');

  return (
    <div style={{ position: 'relative', width: '100%', ...style }}>
      <button
        ref={triggerRef}
        type="button"
        onClick={toggleDropdown}
        style={{
          width: '100%',
          padding: '10px 14px',
          background: '#ffffff',
          border: isOpen ? '1px solid #10b981' : '1px solid #cbd5e1',
          borderRadius: '10px',
          color: '#0f172a',
          fontSize: '0.85rem',
          textAlign: 'left',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          outline: 'none',
          boxShadow: isOpen ? '0 0 0 2px rgba(16, 185, 129, 0.2)' : 'none',
          transition: 'border-color 0.15s, box-shadow 0.15s',
          fontFamily: 'inherit',
          boxSizing: 'border-box',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {displayLabel}
        </span>
        <ChevronDown size={14} style={{ opacity: 0.6, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
      </button>

      {isOpen && createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: 'fixed',
            top: `${coords.top + 4}px`,
            left: `${coords.left}px`,
            width: `${coords.width}px`,
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
            zIndex: 999999,
            maxHeight: '200px',
            overflowY: 'auto',
            padding: '4px',
            boxSizing: 'border-box',
          }}
        >
          {options.map((opt, index) => {
            const optValue = opt.value !== undefined ? opt.value : opt;
            const optLabel = opt.label ?? opt;
            const isSelected = optValue === value;

            return (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  background: isSelected ? 'rgba(16,185,129,0.15)' : 'transparent',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  color: isSelected ? '#047857' : '#1e293b',
                  fontWeight: isSelected ? '600' : 'normal',
                  transition: 'background-color 0.15s',
                }}
                onClick={() => {
                  onChange(optValue);
                  setIsOpen(false);
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.08)';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, textAlign: 'left' }}>
                  {optLabel}
                </span>
                
                {/* Custom actions for category/topic management */}
                <div style={{ display: 'flex', gap: '6px', marginLeft: '8px' }} onClick={e => e.stopPropagation()}>
                  {onEditOption && (
                    <button
                      onClick={() => onEditOption(optValue)}
                      style={{ background: 'none', border: 'none', color: '#3b82f6', padding: '2px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      title="แก้ไขหัวข้อ"
                    >
                      <Edit size={12} />
                    </button>
                  )}
                  {onDeleteOption && (
                    <button
                      onClick={() => onDeleteOption(optValue)}
                      style={{ background: 'none', border: 'none', color: '#ef4444', padding: '2px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      title="ลบหัวข้อ"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>,
        document.body
      )}
    </div>
  );
}

const MONTHS_ENGLISH = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// --- Custom Rounded Dropdown Component with Theme-Green Hover ---
function RoundedDropdown({ value, onChange, options, style = {} }) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);

  const toggleDropdown = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isOpen && 
        triggerRef.current && !triggerRef.current.contains(event.target) &&
        dropdownRef.current && !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const selectedOption = options.find(opt => opt.value === value);
  const label = selectedOption ? selectedOption.label : '';

  return (
    <div style={{ position: 'relative', display: 'inline-block', ...style }}>
      <button
        ref={triggerRef}
        type="button"
        onClick={toggleDropdown}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          padding: '8px 14px',
          borderRadius: '12px',
          border: '1px solid var(--glass-border)',
          background: 'var(--glass-bg)',
          color: 'var(--text-primary)',
          fontSize: '0.78rem',
          fontWeight: '700',
          outline: 'none',
          cursor: 'pointer',
          fontFamily: 'inherit',
          width: '100%',
          transition: 'all 0.15s'
        }}
      >
        <span>{label}</span>
        <ChevronDown size={14} style={{ opacity: 0.7, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      {isOpen && createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: 'absolute',
            top: `${coords.top + 4}px`,
            left: `${coords.left}px`,
            width: `${coords.width}px`,
            background: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 16px -6px rgba(0,0,0,0.05)',
            border: '1px solid #e2e8f0',
            zIndex: 99999,
            overflow: 'hidden',
            padding: '4px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px'
          }}
        >
          {options.map((opt, idx) => {
            const isSelected = opt.value === value;
            return (
              <div
                key={idx}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                style={{
                  padding: '8px 12px',
                  fontSize: '0.78rem',
                  fontWeight: isSelected ? '700' : '500',
                  color: isSelected ? '#ffffff' : '#334155',
                  background: isSelected ? 'var(--gradient-emerald)' : 'transparent',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
                onMouseEnter={e => {
                  if (!isSelected) {
                    e.currentTarget.style.background = '#e8f5e9'; // Soft green hover
                    e.currentTarget.style.color = '#10b981'; // Green text
                  }
                }}
                onMouseLeave={e => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#334155';
                  }
                }}
              >
                {opt.label}
              </div>
            );
          })}
        </div>,
        document.body
      )}
    </div>
  );
}

export default function StudentProfilesView({ students = [], bookings = [], onStudentsChanged, user }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterUnscheduled, setFilterUnscheduled] = useState(false);
  
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth()); // 0-indexed
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  // Helper to determine if a student is unscheduled in the selected month & year
  const isStudentUnscheduled = (studentName) => {
    if (!studentName) return true;
    return !bookings.some(b => {
      if (!b.date || !b.student_name) return false;
      const isSameStudent = b.student_name.trim().toLowerCase() === studentName.trim().toLowerCase();
      if (!isSameStudent) return false;

      // Parse YYYY-MM-DD format safely
      const [yr, mo] = b.date.split('-');
      const bookingYear = parseInt(yr, 10);
      const bookingMonth = parseInt(mo, 10) - 1; // 0-indexed

      const matchesSelectedMonth = bookingYear === selectedYear && bookingMonth === selectedMonth;
      return matchesSelectedMonth && (b.status === 'scheduled' || b.status === 'done');
    });
  };

  // Calculate real-time rescheduled & cancelled counts for a student within the selected calendar month & year
  const getStudentStatsForSelectedMonth = (studentName) => {
    if (!studentName) return { reschedules: 0, cancels: 0 };

    const selectedMonthBookings = bookings.filter(b => {
      if (!b.date || !b.student_name) return false;
      const isSameStudent = b.student_name.trim().toLowerCase() === studentName.trim().toLowerCase();
      if (!isSameStudent) return false;

      // Parse YYYY-MM-DD format safely without timezone shift
      const [yr, mo] = b.date.split('-');
      const bookingYear = parseInt(yr, 10);
      const bookingMonth = parseInt(mo, 10) - 1; // 0-indexed

      return bookingYear === selectedYear && bookingMonth === selectedMonth;
    });

    const reschedules = selectedMonthBookings.filter(b => b.status === 'rescheduled').length;
    const cancels = selectedMonthBookings.filter(b => b.status === 'cancelled').length;

    return { reschedules, cancels };
  };
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [hideEditor, setHideEditor] = useState(false);
  
  // Form State
  const [formName, setFormName] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formColor, setFormColor] = useState(PASTEL_COLORS[0]);
  const [formIsHidden, setFormIsHidden] = useState(false);
  const [showHidden, setShowHidden] = useState(false);

  // English Dossier form fields
  const [formGrade, setFormGrade] = useState('');
  const [formEnrolledDate, setFormEnrolledDate] = useState('');
  const [formCurrentCourse, setFormCurrentCourse] = useState('');
  const [formNextCourse, setFormNextCourse] = useState('');
  const [formReport, setFormReport] = useState(''); // Parent Report Text!

  // Course Topics Global Database list state
  const [topics, setTopics] = useState([]);
  const [showAddTopicField, setShowAddTopicField] = useState(null); // 'current' or 'next'
  const [newTopicText, setNewTopicText] = useState('');

  // Ref to target only the dossier note sheet for html-to-image conversion
  const dossierNoteRef = useRef(null);

  // Load course topics from server
  const fetchTopics = async () => {
    try {
      const res = await apiFetch('/api/topics');
      if (res.ok) {
        const data = await res.json();
        setTopics(data);
      }
    } catch (err) {
      console.error('Error fetching course topics:', err);
    }
  };

  useEffect(() => {
    fetchTopics();
  }, []);

  // Filter students list to ONLY 'งานสอน' (Teaching)
  const filteredStudents = students.filter(s => {
    const isTeaching = (s.category || 'งานสอน') === 'งานสอน';
    if (!isTeaching) return false;

    // Filter hidden students unless explicitly showHidden toggle is active
    if (s.is_hidden && !showHidden) return false;

    const matchesSearch = 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.location && s.location.toLowerCase().includes(searchQuery.toLowerCase()));
    if (!matchesSearch) return false;

    if (filterUnscheduled) {
      return isStudentUnscheduled(s.name);
    }

    return true;
  });

  const handleOpenAdd = () => {
    setModalMode('add');
    setEditingStudentId(null);
    setFormName('');
    setFormLocation('');
    setFormColor(PASTEL_COLORS[0]);
    setFormIsHidden(false);
    setFormGrade('');
    setFormEnrolledDate('');
    setFormCurrentCourse('');
    setFormNextCourse('');
    setFormReport('');
    setShowAddTopicField(null);
    setNewTopicText('');
    setHideEditor(false);
    setShowModal(true);
  };

  const handleOpenEdit = (student) => {
    setModalMode('edit');
    setEditingStudentId(student.id);
    setFormName(student.name);
    setFormLocation(student.location || '');
    setFormColor(student.color || PASTEL_COLORS[0]);
    setFormIsHidden(!!student.is_hidden);
    setFormGrade(student.grade || '');
    setFormEnrolledDate(student.enrolled_date || '');
    setFormCurrentCourse(student.current_course || '');
    setFormNextCourse(student.next_course || '');
    setFormReport(student.report || '');
    setShowAddTopicField(null);
    setNewTopicText('');
    setHideEditor(false);
    setShowModal(true);
  };

  const handleDelete = async (student) => {
    if (user?.isDemo) {
      alert('This is a demo view of the system. Modifying student profiles is disabled.');
      return;
    }
    if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบโปรไฟล์ของ "${student.name}"? การลบนี้จะนำรายชื่อออกและส่งผลต่อตารางงานในระบบ`)) {
      try {
        const res = await apiFetch(`/api/students/${student.id}`, { method: 'DELETE' });
        if (res.ok) {
          if (onStudentsChanged) await onStudentsChanged();
        } else {
          alert('ไม่สามารถลบข้อมูลได้');
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleCreateNewTopic = async (field) => {
    if (user?.isDemo) {
      alert('This is a demo view of the system. Modifying options is disabled.');
      return;
    }
    const trimmed = newTopicText.trim();
    if (!trimmed) {
      setShowAddTopicField(null);
      return;
    }
    try {
      const res = await apiFetch('/api/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed })
      });
      if (res.ok) {
        const saved = await res.json();
        await fetchTopics();
        if (field === 'current') {
          setFormCurrentCourse(saved);
        } else if (field === 'next') {
          setFormNextCourse(saved);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setShowAddTopicField(null);
      setNewTopicText('');
    }
  };

  const handleEditTopic = async (name) => {
    if (user?.isDemo) {
      alert('This is a demo view of the system. Modifying options is disabled.');
      return;
    }
    const newName = prompt(`แก้ไขหัวข้อบทเรียน "${name}" เป็น:`, name);
    if (!newName || !newName.trim() || newName.trim() === name) return;
    try {
      const res = await apiFetch(`/api/topics/${encodeURIComponent(name)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newName: newName.trim() })
      });
      if (res.ok) {
        const saved = await res.json();
        await fetchTopics();
        if (formCurrentCourse === name) setFormCurrentCourse(saved);
        if (formNextCourse === name) setFormNextCourse(saved);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTopic = async (name) => {
    if (user?.isDemo) {
      alert('This is a demo view of the system. Modifying options is disabled.');
      return;
    }
    if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบหัวข้อบทเรียน "${name}" ออกจากระบบส่วนกลาง?`)) {
      try {
        const res = await apiFetch(`/api/topics/${encodeURIComponent(name)}`, { method: 'DELETE' });
        if (res.ok) {
          await fetchTopics();
          if (formCurrentCourse === name) setFormCurrentCourse('');
          if (formNextCourse === name) setFormNextCourse('');
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Convert the dossier paper area to a PNG image and download it to send to parents
  const handleSaveDossierImage = () => {
    if (dossierNoteRef.current === null) return;
    
    toPng(dossierNoteRef.current, {
      cacheBust: true,
      pixelRatio: 2, // High DPI capture for razor-sharp texts
      style: {
        borderRadius: '0px',
        boxShadow: 'none',
        transform: 'none'
      }
    })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `Report_${formName || 'Student'}.png`;
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => {
        console.error('Error rendering image:', err);
        alert('เกิดข้อผิดพลาดในการบันทึกรูปภาพ รายงานประวัติการศึกษา');
      });
  };

  const handleSubmit = async () => {
    if (user?.isDemo) {
      alert('This is a demo view of the system. Modifying student profiles is disabled.');
      return;
    }
    const name = formName.trim();
    if (!name) {
      alert('กรุณากรอกชื่อเล่นนักเรียน');
      return;
    }

    const payload = {
      name,
      category: 'งานสอน', // Lock to Teaching only
      location: formLocation.trim(),
      color: formColor,
      grade: formGrade.trim(),
      enrolled_date: formEnrolledDate.trim(),
      current_course: formCurrentCourse.trim(),
      next_course: formNextCourse.trim(),
      report: formReport.trim(),
      is_hidden: formIsHidden
    };

    try {
      let res;
      if (modalMode === 'add') {
        res = await apiFetch('/api/students', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await apiFetch(`/api/students/${editingStudentId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        if (onStudentsChanged) await onStudentsChanged();
        setShowModal(false);
      } else {
        const errData = await res.json();
        alert(errData.error || 'ไม่สามารถบันทึกข้อมูลได้');
      }
    } catch (err) {
      console.error(err);
      alert('ข้อผิดพลาดในการบันทึกข้อมูลนักเรียน');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', padding: '0 24px 24px 24px', boxSizing: 'border-box' }}>
      <style>{`
        @keyframes pulseBorderGlow {
          0% {
            box-shadow: 0 0 4px rgba(245, 158, 11, 0.15), 0 4px 6px -1px rgba(0,0,0,0.02);
            border-color: rgba(245, 158, 11, 0.4) !important;
          }
          50% {
            box-shadow: 0 0 20px rgba(245, 158, 11, 0.55), 0 10px 15px -3px rgba(245, 158, 11, 0.1);
            border-color: rgba(245, 158, 11, 1) !important;
          }
          100% {
            box-shadow: 0 0 4px rgba(245, 158, 11, 0.15), 0 4px 6px -1px rgba(0,0,0,0.02);
            border-color: rgba(245, 158, 11, 0.4) !important;
          }
        }
        .unscheduled-glow-card {
          animation: pulseBorderGlow 2s infinite ease-in-out;
          border-width: 2.5px !important;
          background: #fffbeb !important;
        }
      `}</style>
      
      {/* Top Search & Actions Bar */}
      <div className="profiles-header-container">
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.3rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
            <User size={20} style={{ color: 'var(--primary)' }} />
            Student Profiles
          </h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            จัดการข้อมูลและโปรไฟล์ส่วนตัวของนักเรียนเฉพาะหมวดงานสอน
          </span>
        </div>

        <div className="profiles-actions-bar">
          {/* Month & Year Selection Dropdowns */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <RoundedDropdown
              value={selectedMonth}
              onChange={val => setSelectedMonth(val)}
              options={MONTHS_ENGLISH.map((m, idx) => ({ value: idx, label: m }))}
              style={{ width: '130px' }}
            />

            <RoundedDropdown
              value={selectedYear}
              onChange={val => setSelectedYear(val)}
              options={[2025, 2026, 2027, 2028].map(y => ({ value: y, label: y.toString() }))}
              style={{ width: '90px' }}
            />
          </div>

          {/* Unscheduled Filter Toggle Switch */}
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              cursor: 'pointer',
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              padding: '6px 12px',
              borderRadius: '10px',
              userSelect: 'none',
              boxShadow: filterUnscheduled ? '0 0 12px rgba(245, 158, 11, 0.15)' : 'none',
              transition: 'all 0.2s'
            }} 
            onClick={() => setFilterUnscheduled(!filterUnscheduled)}
            title="กรองเพื่อดูเฉพาะรายชื่อเด็กที่ผู้ปกครองยังไม่ได้ลงตารางเรียนในเดือนที่เลือก"
          >
            <span style={{ fontSize: '0.78rem', fontWeight: '800', color: filterUnscheduled ? '#d97706' : 'var(--text-secondary)' }}>
              ยังไม่ได้ลงตารางเรียน
            </span>
            <div
              style={{
                width: '38px',
                height: '20px',
                borderRadius: '10px',
                background: filterUnscheduled ? '#f59e0b' : '#cbd5e1',
                position: 'relative',
                transition: 'background-color 0.2s',
              }}
            >
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: '#ffffff',
                  position: 'absolute',
                  top: '2px',
                  left: filterUnscheduled ? '20px' : '2px',
                  transition: 'left 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.15)'
                }}
              />
            </div>
          </div>

          {/* Show Hidden / Suspended Students Filter Toggle */}
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              cursor: 'pointer',
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              padding: '6px 12px',
              borderRadius: '10px',
              userSelect: 'none',
              boxShadow: showHidden ? '0 0 12px rgba(99, 102, 241, 0.15)' : 'none',
              transition: 'all 0.2s'
            }} 
            onClick={() => setShowHidden(!showHidden)}
            title="แสดงรายชื่อนักเรียนที่ซ่อนไว้ / พักการเรียน"
          >
            <span style={{ fontSize: '0.78rem', fontWeight: '800', color: showHidden ? '#6366f1' : 'var(--text-secondary)' }}>
              แสดงนักเรียนที่ซ่อนไว้
            </span>
            <div
              style={{
                width: '38px',
                height: '20px',
                borderRadius: '10px',
                background: showHidden ? '#6366f1' : '#cbd5e1',
                position: 'relative',
                transition: 'background-color 0.2s',
              }}
            >
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: '#ffffff',
                  position: 'absolute',
                  top: '2px',
                  left: showHidden ? '20px' : '2px',
                  transition: 'left 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.15)'
                }}
              />
            </div>
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', width: '260px' }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.7 }} />
            <input
              type="text"
              placeholder="ค้นหาชื่อเล่น, สถานที่เรียน..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 34px',
                borderRadius: '10px',
                border: '1px solid var(--glass-border)',
                background: 'var(--glass-bg)',
                color: 'var(--text-primary)',
                fontSize: '0.8rem',
                outline: 'none',
                transition: 'var(--transition-fast)',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Add Profile Button */}
          <button
            onClick={handleOpenAdd}
            style={{
              background: 'var(--gradient-emerald)',
              border: 'none',
              color: '#ffffff',
              padding: '8px 16px',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 6px -1px rgba(16,185,129,0.2)'
            }}
          >
            <Plus size={14} />
            เพิ่มโปรไฟล์นักเรียน
          </button>
        </div>
      </div>

      {/* Profiles Cards Grid */}
      <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
        {filteredStudents.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '240px', border: '1.5px dashed var(--glass-border)', borderRadius: '16px', color: 'var(--text-muted)', background: 'var(--glass-bg)' }}>
            <Sparkles size={36} style={{ opacity: 0.3, marginBottom: '12px' }} />
            <span style={{ fontWeight: '700' }}>ไม่พบโปรไฟล์รายชื่อนักเรียน</span>
            <span style={{ fontSize: '0.72rem', opacity: 0.7, marginTop: '4px' }}>คุณสามารถเพิ่มรายชื่อผู้เรียนใหม่ได้โดยกดปุ่มด้านบน</span>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
            {filteredStudents.map(student => {
              const borderTheme = student.is_hidden ? '#94a3b8' : (student.color || '#8b5cf6');
              const isUnscheduled = isStudentUnscheduled(student.name);
              const isCardHighlighted = filterUnscheduled && isUnscheduled;
              return (
                <div
                  key={student.id}
                  onClick={() => handleOpenEdit(student)}
                  className={`glass-card ${isCardHighlighted ? 'unscheduled-glow-card' : ''}`}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    padding: '14px 16px',
                    borderRadius: '12px',
                    borderTop: isCardHighlighted ? '4px solid #f59e0b' : `4px solid ${borderTheme}`,
                    background: student.is_hidden ? 'rgba(241, 245, 249, 0.8)' : isCardHighlighted ? 'rgba(255, 251, 235, 0.95)' : 'var(--glass-bg)',
                    boxShadow: isCardHighlighted ? '0 0 16px rgba(245, 158, 11, 0.35)' : '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.01)',
                    transition: 'transform 0.15s, box-shadow 0.15s, background-color 0.15s, border-color 0.15s',
                    cursor: 'pointer',
                    position: 'relative',
                    opacity: student.is_hidden ? 0.72 : 1
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.05), 0 4px 6px -2px rgba(0,0,0,0.02)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.01)';
                  }}
                >
                  {/* Top Bar inside Card */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: borderTheme }} />
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: '700' }}>
                        {student.category || 'งานสอน'}
                      </span>
                    </div>

                    {/* Actions Overlay */}
                    <div style={{ display: 'flex', gap: '4px' }} onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => handleOpenEdit(student)}
                        style={{
                          background: 'rgba(59,130,246,0.1)',
                          border: 'none',
                          color: '#3b82f6',
                          borderRadius: '6px',
                          padding: '5px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'background-color 0.15s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(59,130,246,0.2)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(59,130,246,0.1)'}
                        title="แก้ไข"
                      >
                        <Edit size={12} />
                      </button>
                      
                      <button
                        onClick={() => handleDelete(student)}
                        style={{
                          background: 'rgba(239,68,68,0.1)',
                          border: 'none',
                          color: '#ef4444',
                          borderRadius: '6px',
                          padding: '5px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'background-color 0.15s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.2)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)'}
                        title="ลบ"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Student Details */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '2px' }}>
                    <div style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span>{student.name}</span>
                      {student.is_hidden && (
                        <span style={{
                          background: '#f1f5f9',
                          color: '#64748b',
                          fontSize: '0.62rem',
                          fontWeight: '800',
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          border: '1px solid #cbd5e1',
                          height: '18px',
                          flexShrink: 0
                        }}>
                          <EyeOff size={10} />
                          พักการเรียน
                        </span>
                      )}
                      {isUnscheduled && !student.is_hidden && (
                        <span style={{
                          background: '#fffbeb',
                          color: '#d97706',
                          fontSize: '0.62rem',
                          fontWeight: '800',
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          border: '1px solid #fde68a',
                          height: '18px',
                          flexShrink: 0
                        }}>
                          <AlertTriangle size={10} />
                          ยังไม่ได้ลงตาราง
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '4px' }}>
                      <MapPin size={12} style={{ color: '#ef4444', flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {student.location || 'ไม่ได้ระบุสถานที่เรียน'}
                      </span>
                    </div>

                    {student.grade && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '2px' }}>
                        <GraduationCap size={12} style={{ color: '#8b5cf6', flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          Grade: {student.grade}
                        </span>
                      </div>
                    )}

                    {/* Monthly rescheduling and cancelling counts */}
                    {(() => {
                      const stats = getStudentStatsForSelectedMonth(student.name);
                      return (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                          <span style={{ fontSize: '0.65rem', padding: '3px 8px', borderRadius: '6px', background: 'rgba(245, 158, 11, 0.1)', color: '#d97706', fontWeight: '700' }}>
                            เลื่อน: {stats.reschedules} ครั้ง
                          </span>
                          <span style={{ fontSize: '0.65rem', padding: '3px 8px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontWeight: '700' }}>
                            ยกเลิก: {stats.cancels} ครั้ง
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Folded Booklet Style Modal (กระดาษพับครึ่งเด้งขึ้นมา) */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div
            className="profile-modal-book-container animate-fade-in"
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: hideEditor ? '500px' : '850px',
            }}
          >
            {/* Close Button top-right */}
            <button
              onClick={() => setShowModal(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '50%',
                padding: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 20,
                color: '#64748b',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}
              title="Close Dossier"
            >
              <X size={14} />
            </button>

            {/* Left Page (Form Input Page) */}
            <div
              style={{
                display: hideEditor ? 'none' : 'flex',
                flex: 1.1,
                padding: '30px 32px',
                background: '#ffffff',
                borderRight: '1px solid rgba(0,0,0,0.08)',
                boxShadow: 'inset -12px 0 16px -12px rgba(0,0,0,0.08)',
                flexDirection: 'column',
                boxSizing: 'border-box',
                maxHeight: '90vh',
                overflowY: 'auto'
              }}
            >
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#1e293b', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px', flexShrink: 0 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={16} style={{ color: '#10b981' }} />
                  {modalMode === 'add' ? 'CREATE PROFILE' : 'STUDENT PROFILE'}
                </span>

                {/* A5 Slide Toggle Switch aligned right */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => setHideEditor(true)} title="Full Preview (A5)">
                  <span style={{ fontSize: '0.68rem', fontWeight: '800', color: '#64748b', letterSpacing: '0.05em' }}>FULL PREVIEW (A5)</span>
                  <div
                    style={{
                      width: '38px',
                      height: '20px',
                      borderRadius: '10px',
                      background: '#cbd5e1',
                      position: 'relative',
                      transition: 'background-color 0.2s',
                    }}
                  >
                    <div
                      style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        background: '#ffffff',
                        position: 'absolute',
                        top: '2px',
                        left: '2px',
                        transition: 'left 0.2s',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.15)'
                      }}
                    />
                  </div>
                </div>
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                
                {/* Student Nickname */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.65rem', fontWeight: '700', color: '#64748b', letterSpacing: '0.05em' }}>NICKNAME</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    placeholder="ป้อนชื่อเล่นนักเรียน..."
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.8rem',
                      outline: 'none',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>

                {/* Suspension / Hidden Status Toggle */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  background: 'rgba(241, 245, 249, 0.5)',
                  border: '1px solid #e2e8f0',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  marginTop: '4px',
                  boxSizing: 'border-box'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#1e293b' }}>พักการเรียน / ซ่อนรายชื่อ</span>
                    <span style={{ fontSize: '0.62rem', color: '#64748b' }}>นักเรียนจะไม่แสดงในตารางหลัก แต่ข้อมูลจะไม่ถูกลบ</span>
                  </div>
                  <div 
                    style={{ 
                      width: '38px', 
                      height: '20px', 
                      borderRadius: '10px', 
                      background: formIsHidden ? '#6366f1' : '#cbd5e1', 
                      position: 'relative', 
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onClick={() => setFormIsHidden(!formIsHidden)}
                  >
                    <div
                      style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        background: '#ffffff',
                        position: 'absolute',
                        top: '2px',
                        left: formIsHidden ? '20px' : '2px',
                        transition: 'left 0.2s',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.15)'
                      }}
                    />
                  </div>
                </div>

                {/* Grade & Joined Date side by side */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {/* Grade */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.65rem', fontWeight: '700', color: '#64748b', letterSpacing: '0.05em' }}>GRADE (INTERNATIONAL YEAR)</label>
                    <input
                      type="text"
                      value={formGrade}
                      onChange={e => setFormGrade(e.target.value)}
                      placeholder="เช่น Grade 4 / Year 5..."
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.8rem',
                        outline: 'none',
                        fontFamily: 'inherit',
                      }}
                    />
                  </div>

                  {/* Enrolled Date */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.65rem', fontWeight: '700', color: '#64748b', letterSpacing: '0.05em' }}>JOINED DATE</label>
                    <input
                      type="text"
                      value={formEnrolledDate}
                      onChange={e => setFormEnrolledDate(e.target.value)}
                      placeholder="เช่น 1 ก.ค. 2569 หรือ July 2026..."
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.8rem',
                        outline: 'none',
                        fontFamily: 'inherit',
                      }}
                    />
                  </div>
                </div>

                {/* Current Course Topic */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.65rem', fontWeight: '700', color: '#64748b', letterSpacing: '0.05em' }}>CURRENT COURSE TOPIC</label>
                  {showAddTopicField === 'current' ? (
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <input
                        type="text"
                        value={newTopicText}
                        onChange={e => setNewTopicText(e.target.value)}
                        placeholder="พิมพ์หัวข้อบทเรียนใหม่..."
                        autoFocus
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: '1px solid #10b981',
                          fontSize: '0.8rem',
                          outline: 'none',
                          fontFamily: 'inherit',
                        }}
                      />
                      <button
                        onClick={() => handleCreateNewTopic('current')}
                        style={{ background: '#10b981', border: 'none', color: '#fff', padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={() => setShowAddTopicField(null)}
                        style={{ background: '#ef4444', border: 'none', color: '#fff', padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <CustomSelect
                          value={formCurrentCourse}
                          onChange={val => setFormCurrentCourse(val)}
                          options={topics.map(t => ({ value: t, label: t }))}
                          onEditOption={handleEditTopic}
                          onDeleteOption={handleDeleteTopic}
                          placeholder="-- เลือกหัวข้อบทเรียน --"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowAddTopicField('current')}
                        style={{
                          padding: '10px 12px',
                          background: 'var(--gradient-emerald)',
                          border: 'none',
                          color: '#fff',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Next Course Topic */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.65rem', fontWeight: '700', color: '#64748b', letterSpacing: '0.05em' }}>NEXT COURSE TOPIC</label>
                  {showAddTopicField === 'next' ? (
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <input
                        type="text"
                        value={newTopicText}
                        onChange={e => setNewTopicText(e.target.value)}
                        placeholder="พิมพ์หัวข้อบทเรียนใหม่..."
                        autoFocus
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: '1px solid #10b981',
                          fontSize: '0.8rem',
                          outline: 'none',
                          fontFamily: 'inherit',
                        }}
                      />
                      <button
                        onClick={() => handleCreateNewTopic('next')}
                        style={{ background: '#10b981', border: 'none', color: '#fff', padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={() => setShowAddTopicField(null)}
                        style={{ background: '#ef4444', border: 'none', color: '#fff', padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <CustomSelect
                          value={formNextCourse}
                          onChange={val => setFormNextCourse(val)}
                          options={topics.map(t => ({ value: t, label: t }))}
                          onEditOption={handleEditTopic}
                          onDeleteOption={handleDeleteTopic}
                          placeholder="-- เลือกหัวข้อบทเรียน --"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowAddTopicField('next')}
                        style={{
                          padding: '10px 12px',
                          background: 'var(--gradient-emerald)',
                          border: 'none',
                          color: '#fff',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  )}
                </div>


                {/* Location */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.65rem', fontWeight: '700', color: '#64748b', letterSpacing: '0.05em' }}>LOCATION</label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={e => setFormLocation(e.target.value)}
                    placeholder="ป้อนสถานที่เรียน (เช่น บ้าน, คอนโด)..."
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.8rem',
                      outline: 'none',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>

                {/* Parent Report Text Input */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.65rem', fontWeight: '700', color: '#64748b', letterSpacing: '0.05em' }}>STUDENT REPORT (FOR PARENTS)</label>
                  <textarea
                    value={formReport}
                    onChange={e => setFormReport(e.target.value)}
                    placeholder="เขียนรายงานความคิดเห็น บทเรียนที่เรียนวันนี้ หรือพฤติกรรมของนักเรียนส่งผู้ปกครอง..."
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.8rem',
                      outline: 'none',
                      fontFamily: 'inherit',
                      minHeight: '90px',
                      resize: 'vertical',
                      lineHeight: '1.4'
                    }}
                  />
                </div>

                {/* Color Accent */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.65rem', fontWeight: '700', color: '#64748b', letterSpacing: '0.05em' }}>THEME COLOR ACCENT</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '6px' }}>
                    {PASTEL_COLORS.slice(0, 16).map(c => (
                      <div
                        key={c}
                        onClick={() => setFormColor(c)}
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          background: c,
                          cursor: 'pointer',
                          border: formColor === c ? '3px solid #1e293b' : '1px solid #e2e8f0',
                          transition: 'transform 0.1s',
                          justifySelf: 'center'
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Monthly Schedule Stats Summary Box (Left Form) */}
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                  <label style={{ fontSize: '0.62rem', fontWeight: '800', color: '#64748b', letterSpacing: '0.05em' }}>
                    MONTHLY SCHEDULE STATS ({MONTHS_ENGLISH[selectedMonth]} {selectedYear})
                  </label>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#334155' }}>
                    <span>Rescheduled classes (เลื่อนนัดเรียน):</span>
                    <span style={{ fontWeight: '700', color: '#d97706' }}>{getStudentStatsForSelectedMonth(formName).reschedules} ครั้ง</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#334155' }}>
                    <span>Cancelled classes (ยกเลิกนัด):</span>
                    <span style={{ fontWeight: '700', color: '#ef4444' }}>{getStudentStatsForSelectedMonth(formName).cancels} ครั้ง</span>
                  </div>
                </div>
              </div>

              {/* Form Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #e2e8f0', flexShrink: 0 }}>
                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    color: '#475569',
                    borderRadius: '8px',
                    padding: '6px 14px',
                    cursor: 'pointer',
                    fontSize: '0.78rem',
                    fontWeight: '600',
                    fontFamily: 'inherit'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  style={{
                    background: 'var(--gradient-emerald)',
                    border: 'none',
                    color: '#fff',
                    borderRadius: '8px',
                    padding: '6px 16px',
                    cursor: 'pointer',
                    fontSize: '0.78rem',
                    fontWeight: '700',
                    fontFamily: 'inherit'
                  }}
                >
                  Save Dossier
                </button>
              </div>
            </div>

            {/* Right Page (Dossier Preview Page) */}
            <div
              style={{
                flex: hideEditor ? 1 : 0.9,
                padding: '30px 32px',
                background: '#faf8f5', // Soft ivory color
                boxShadow: hideEditor ? 'none' : 'inset 12px 0 16px -12px rgba(0,0,0,0.08)',
                display: 'flex',
                flexDirection: 'column',
                boxSizing: 'border-box',
                maxHeight: '90vh',
                position: 'relative'
              }}
            >
              {/* Header with Save Image Button */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2.5px dashed #e2e8f0', paddingBottom: '8px', flexShrink: 0, paddingRight: '28px' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: '800', color: '#64748b', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                  <GraduationCap size={16} style={{ color: formColor }} />
                  STUDENT BRIEF DOSSIER
                </h3>

                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {/* Slide Toggle Switch shown only when editor is hidden to allow turning it back on */}
                  {hideEditor && (
                    <div style={{ display: 'flex', alignItems: 'center', marginRight: '16px', cursor: 'pointer' }} onClick={() => setHideEditor(false)} title="Show Editor">
                      <div
                        style={{
                          width: '38px',
                          height: '20px',
                          borderRadius: '10px',
                          background: '#10b981', // Green on state
                          position: 'relative',
                          transition: 'background-color 0.2s',
                        }}
                      >
                        <div
                          style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            background: '#ffffff',
                            position: 'absolute',
                            top: '2px',
                            left: '20px', // Slid to right!
                            transition: 'left 0.2s',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.15)'
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleSaveDossierImage}
                    style={{
                      background: '#10b981',
                      border: 'none',
                      color: '#ffffff',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      boxShadow: '0 2px 4px rgba(16,185,129,0.15)',
                      fontFamily: 'inherit',
                    }}
                    title="บันทึกภาพรายงานสำหรับส่งทาง LINE"
                  >
                    <Download size={12} />
                    Save Image
                  </button>
                </div>
              </div>

              {/* School Dossier Ruled Notebook Style - Captured by html-to-image */}
              <div
                ref={dossierNoteRef}
                style={{
                  flex: 1,
                  background: '#faf8f5', // Lock color so screenshot captures it ivory
                  backgroundImage: 'linear-gradient(rgba(0,0,0,0) 96%, #e2e8f0 96%)',
                  backgroundSize: '100% 32px',
                  padding: '0px 12px 12px 20px', // Set paddingTop to 0px to align exactly to first ruled line!
                  borderLeft: '2.5px solid #fca5a5', // Red margin line
                  display: 'flex',
                  flexDirection: 'column',
                  fontSize: '0.88rem',
                  color: '#334155',
                  boxSizing: 'border-box',
                  overflowY: 'auto',
                  borderRadius: '4px'
                }}
              >
                {/* Large Title Hand-written style (First line, 32px tall, margin 0!) */}
                <div style={{ height: '32px', display: 'flex', alignItems: 'center', margin: 0, padding: 0 }}>
                  <span style={{ fontWeight: '800', color: formColor, fontSize: '1.35rem', lineHeight: '32px' }}>
                    {formName || 'Student Name'}
                  </span>
                </div>

                {/* Grade line (Second line, 32px tall, margin 0!) */}
                <div style={{ height: '32px', display: 'flex', gap: '8px', margin: 0, padding: 0 }}>
                  <span style={{ color: '#64748b', fontWeight: '700', fontSize: '0.72rem', letterSpacing: '0.05em', lineHeight: '32px' }}>GRADE:</span>
                  <span style={{ fontWeight: '600', color: '#1e293b', lineHeight: '32px' }}>{formGrade || '-'}</span>
                </div>

                {/* Current Subject line (Third line, 32px tall, margin 0!) */}
                <div style={{ height: '32px', display: 'flex', gap: '8px', margin: 0, padding: 0 }}>
                  <span style={{ color: '#64748b', fontWeight: '700', fontSize: '0.72rem', letterSpacing: '0.05em', lineHeight: '32px' }}>CURRENT TOPIC:</span>
                  <span style={{ fontWeight: '600', color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: '32px' }}>{formCurrentCourse || '-'}</span>
                </div>

                {/* Next Milestone line (Fourth line, 32px tall, margin 0!) */}
                <div style={{ height: '32px', display: 'flex', gap: '8px', margin: 0, padding: 0 }}>
                  <span style={{ color: '#64748b', fontWeight: '700', fontSize: '0.72rem', letterSpacing: '0.05em', lineHeight: '32px' }}>NEXT MILESTONE:</span>
                  <span style={{ fontWeight: '600', color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: '32px' }}>{formNextCourse || '-'}</span>
                </div>

                {/* Ruled lines spacer (Fifth line, 32px tall, margin 0!) */}
                <div style={{ height: '32px', margin: 0, padding: 0 }} />

                {/* Report Section Title (Sixth line, 32px tall, margin 0!) */}
                <div style={{ height: '32px', display: 'flex', margin: 0, padding: 0 }}>
                  <span style={{ color: '#64748b', fontWeight: '800', fontSize: '0.75rem', letterSpacing: '0.05em', lineHeight: '32px' }}>STUDENT REPORT:</span>
                </div>

                {/* Report Content wrapping lines (Seventh line and onwards, 32px lineHeight, margin 0!) */}
                <div 
                  style={{ 
                    lineHeight: '32px', 
                    fontWeight: '600', 
                    color: '#0f172a',
                    whiteSpace: 'pre-wrap', 
                    wordBreak: 'break-word',
                    fontFamily: 'inherit',
                    margin: 0,
                    padding: 0
                  }}
                >
                  {formReport || 'ไม่มีบันทึกรายงานผลในครั้งนี้'}
                </div>
              </div>

              {/* Decorative tape overlay on preview */}
              <div
                style={{
                  position: 'absolute',
                  top: '12px',
                  left: '42%',
                  width: '60px',
                  height: '14px',
                  background: 'rgba(251, 191, 36, 0.3)',
                  transform: 'rotate(-4deg)',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
