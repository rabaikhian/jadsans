import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Calendar as CalendarIcon, CalendarDays, Filter, Clock, Edit, Trash2, X, AlertCircle, Tag, ChevronDown, Lock, Share2, Check, Database, Download, Upload } from 'lucide-react';
import { apiFetch } from '../api';

const getLocalDateString = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};


const AVAILABLE_COLORS = (() => {
  const colors = [];
  const hues = [0, 25, 45, 75, 110, 145, 175, 195, 215, 235, 255, 275, 295, 315, 335, 350]; // 16 hues
  const lightnesses = [40, 52, 64, 76]; // 4 brightness levels
  for (let h of hues) {
    for (let l of lightnesses) {
      colors.push(`hsl(${h}, 85%, ${l}%)`);
    }
  }
  return colors;
})();

const START_TIME_OPTIONS = (() => {
  const options = [];
  for (let h = 9; h <= 20; h++) {
    const hStr = String(h).padStart(2, '0');
    options.push(`${hStr}:00`);
    if (h < 20) {
      options.push(`${hStr}:30`);
    }
  }
  return options;
})();

const END_TIME_OPTIONS = (() => {
  const options = [];
  for (let h = 9; h <= 24; h++) {
    const hStr = String(h).padStart(2, '0');
    options.push(`${hStr}:00`);
    if (h < 24) {
      options.push(`${hStr}:30`);
    }
  }
  return options;
})();

const getStudentLabel = (category) => {
  switch (category) {
    case 'งานสอน':
      return 'STUDENT NAME';
    case 'งานประชุม':
      return 'MEETING TOPIC';
    case 'งานประกัน':
      return 'INSURANCE TOPIC';
    case 'งานนัดลูกค้า':
      return 'CLIENT NAME';
    default:
      return 'STUDENT NAME';
  }
};

const getStudentPlaceholder = (category) => {
  switch (category) {
    case 'งานสอน':
      return '-- เลือกรายชื่อนักเรียน --';
    case 'งานประชุม':
      return '-- เลือกหัวข้อประชุม --';
    case 'งานประกัน':
      return '-- เลือกหัวข้องานประกัน --';
    case 'งานนัดลูกค้า':
      return '-- เลือกรายชื่อลูกค้า --';
    default:
      return '-- เลือกรายชื่อ --';
  }
};

// Color map generator for students (fallback only)
const studentColors = [
  { bg: 'rgba(192, 132, 252, 0.15)', border: '#c084fc', text: '#e9d5ff' }, // Purple
  { bg: 'rgba(96, 165, 250, 0.15)', border: '#60a5fa', text: '#dbeafe' },  // Blue
  { bg: 'rgba(52, 211, 153, 0.15)', border: '#34d399', text: '#d1fae5' },  // Emerald
  { bg: 'rgba(245, 158, 11, 0.15)', border: '#f59e0b', text: '#fef3c7' },  // Amber
  { bg: 'rgba(248, 113, 113, 0.15)', border: '#f87171', text: '#fee2e2' },  // Red
  { bg: 'rgba(251, 113, 133, 0.15)', border: '#fb7185', text: '#ffe4e6' },  // Rose
  { bg: 'rgba(45, 212, 191, 0.15)', border: '#2dd4bf', text: '#ccfbf1' },  // Teal
  { bg: 'rgba(163, 230, 53, 0.15)', border: '#a3e635', text: '#ecfccb' }   // Lime
];

const getStudentStyle = (studentName, allStudents) => {
  const index = allStudents.indexOf(studentName);
  if (index === -1) return studentColors[0];
  return studentColors[index % studentColors.length];
};

// ─── Custom Select Component ──────────────────────────────────────────────────
function CustomSelect({ value, onChange, options, placeholder, onDeleteOption, onEditOption, isMulti = false, maxSelect = 4, style = {} }) {
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

  const getSelectedValues = () => {
    if (!isMulti) return value ? [value] : [];
    if (!value) return [];
    return typeof value === 'string' ? value.split(', ') : value;
  };

  const selectedValues = getSelectedValues();

  const handleOptionClick = (optValue) => {
    if (isMulti) {
      let nextValues;
      if (selectedValues.includes(optValue)) {
        nextValues = selectedValues.filter(v => v !== optValue);
      } else {
        if (selectedValues.length >= maxSelect) {
          alert(`สามารถเลือกได้สูงสุด ${maxSelect} คน/หัวข้อ`);
          return;
        }
        nextValues = [...selectedValues, optValue];
      }
      onChange(nextValues.join(', '));
    } else {
      onChange(optValue);
      setIsOpen(false);
    }
  };

  let displayLabel = placeholder || '-- เลือก --';
  if (selectedValues.length > 0) {
    displayLabel = selectedValues.map(v => {
      const opt = options.find(o => o.value === v);
      return opt ? opt.label : v;
    }).join(', ');
  }

  return (
    <div style={{ position: 'relative', width: '100%', ...style }}>
      <button
        ref={triggerRef}
        type="button"
        onClick={toggleDropdown}
        style={{
          width: '100%',
          padding: '8px 12px',
          background: 'rgba(255, 255, 255, 0.06)',
          border: isOpen ? '1px solid #10b981' : '1px solid var(--glass-border)',
          borderRadius: '10px',
          color: 'var(--text-primary)',
          fontSize: '0.8rem',
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
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: '8px' }}>
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
            maxHeight: '220px',
            overflowY: 'auto',
            padding: '4px',
            boxSizing: 'border-box',
          }}
        >
          {options.map((opt, index) => {
            const optValue = opt.value !== undefined ? opt.value : opt;
            const optLabel = opt.label ?? opt;
            const isSelected = selectedValues.includes(optValue);

            if (optValue === '__ADD_NEW__') {
              return (
                <div
                  key={index}
                  onClick={() => {
                    onChange(optValue);
                    setIsOpen(false);
                  }}
                  style={{
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '0.8rem',
                    color: '#8b5cf6',
                    cursor: 'pointer',
                    fontWeight: '600',
                    textAlign: 'left',
                    transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(139,92,246,0.08)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  {optLabel}
                </div>
              );
            }

            return (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderRadius: '8px',
                  padding: '4px 6px 4px 12px',
                  background: isSelected ? 'rgba(16,185,129,0.15)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s',
                  boxSizing: 'border-box',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.08)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <div
                  onClick={() => handleOptionClick(optValue)}
                  style={{
                    flex: 1,
                    padding: '4px 0',
                    fontSize: '0.8rem',
                    color: isSelected ? '#047857' : '#1e293b',
                    fontWeight: isSelected ? '600' : 'normal',
                    textAlign: 'left',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {isMulti && (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      style={{ accentColor: '#10b981', cursor: 'pointer', pointerEvents: 'none' }}
                    />
                  )}
                  {optLabel}
                </div>

                <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                  {onEditOption && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditOption(opt);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: '6px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#3b82f6',
                        transition: 'background-color 0.15s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(59,130,246,0.12)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      title="แก้ไข"
                    >
                      <Edit size={12} />
                    </button>
                  )}

                  {onDeleteOption && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteOption(opt);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: '6px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ef4444',
                        transition: 'background-color 0.15s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.12)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      title="ลบ"
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

// --- Custom Rounded Dropdown Component with Theme-Green Hover ---
function RoundedDropdown({ value, onChange, options, style = {}, buttonStyle = {} }) {
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
          padding: '6px 12px',
          borderRadius: '12px',
          border: '1px solid var(--glass-border)',
          background: 'var(--glass-bg)',
          color: 'var(--text-main)',
          fontSize: '1.25rem',
          fontWeight: 'bold',
          outline: 'none',
          cursor: 'pointer',
          fontFamily: 'inherit',
          width: '100%',
          transition: 'all 0.15s',
          boxSizing: 'border-box',
          ...buttonStyle
        }}
      >
        <span>{label}</span>
        <ChevronDown size={16} style={{ opacity: 0.7, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
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
            gap: '2px',
            boxSizing: 'border-box'
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
                  fontSize: '0.9rem',
                  fontWeight: isSelected ? '700' : '500',
                  color: isSelected ? '#ffffff' : '#334155',
                  background: isSelected ? 'var(--gradient-emerald)' : 'transparent',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  textAlign: 'left'
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

export default function MasterView({ bookings, students = [], categories = [], onStudentsChanged, onCategoriesChanged, loading, user, onBookingsChanged }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedStudentFilter, setSelectedStudentFilter] = useState(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState(null);
  const [showDayEventsModal, setShowDayEventsModal] = useState(false);
  const [modalDateStr, setModalDateStr] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [backupStatus, setBackupStatus] = useState({ type: '', message: '' });
  const [backupLoading, setBackupLoading] = useState(false);

  const handleDownloadBackup = async () => {
    try {
      setBackupLoading(true);
      setBackupStatus({ type: '', message: '' });
      const res = await apiFetch('/api/backup');
      if (!res.ok) throw new Error('Failed to generate backup');
      const data = await res.json();
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const date = new Date();
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      a.href = url;
      a.download = `jadsans_backup_${y}_${m}_${d}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setBackupStatus({ type: 'success', message: 'ดาวน์โหลดไฟล์สำรองข้อมูลสำเร็จ!' });
    } catch (err) {
      console.error(err);
      setBackupStatus({ type: 'error', message: 'เกิดข้อผิดพลาดในการดาวน์โหลดข้อมูลสำรอง' });
    } finally {
      setBackupLoading(false);
    }
  };

  const handleRestoreBackup = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset status
    setBackupStatus({ type: '', message: '' });

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        setBackupLoading(true);
        setBackupStatus({ type: 'info', message: 'กำลังกู้คืนข้อมูล...' });
        const data = JSON.parse(evt.target.result);
        
        if (!data || (!data.bookings && !data.students && !data.categories)) {
          throw new Error('รูปแบบไฟล์สำรองข้อมูลไม่ถูกต้อง');
        }

        const res = await apiFetch('/api/restore', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        if (res.ok) {
          const result = await res.json();
          setBackupStatus({ 
            type: 'success', 
            message: `กู้คืนข้อมูลสำเร็จ! (ตารางเรียน: ${result.bookingsCount}, นักเรียน: ${result.studentsCount}, หมวดหมู่: ${result.categoriesCount})` 
          });
          if (onStudentsChanged) await onStudentsChanged();
          if (onBookingsChanged) await onBookingsChanged();
          if (onCategoriesChanged) await onCategoriesChanged();
        } else {
          const err = await res.json();
          throw new Error(err.error || 'Failed to restore backup');
        }
      } catch (err) {
        console.error(err);
        setBackupStatus({ type: 'error', message: err.message || 'เกิดข้อผิดพลาดในการกู้คืนข้อมูลสำรอง' });
      } finally {
        setBackupLoading(false);
      }
    };
    reader.readAsText(file);
    
    // Reset file input value so same file can be selected again
    e.target.value = '';
  };

  const handleRestoreFromBrowserCache = async () => {
    const activeEmail = user?.email;
    if (!activeEmail) {
      setBackupStatus({ type: 'error', message: 'กรุณาเข้าสู่ระบบก่อน' });
      return;
    }
    const cacheStr = localStorage.getItem(`jadsans_auto_backup_${activeEmail}`);
    if (!cacheStr) {
      setBackupStatus({ type: 'error', message: 'ไม่พบข้อมูลสำรองในเว็บเบราว์เซอร์นี้' });
      return;
    }

    try {
      setBackupLoading(true);
      setBackupStatus({ type: 'info', message: 'กำลังกู้คืนข้อมูลจากเบราว์เซอร์...' });
      const data = JSON.parse(cacheStr);
      
      if (!data || (!data.bookings && !data.students && !data.categories)) {
        throw new Error('รูปแบบข้อมูลสำรองในเบราว์เซอร์ไม่ถูกต้อง');
      }

      const res = await apiFetch('/api/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        const result = await res.json();
        setBackupStatus({ 
          type: 'success', 
          message: `กู้คืนข้อมูลสำเร็จ! (ตารางเรียน: ${result.bookingsCount}, นักเรียน: ${result.studentsCount}, หมวดหมู่: ${result.categoriesCount})` 
        });
        if (onStudentsChanged) await onStudentsChanged();
        if (onBookingsChanged) await onBookingsChanged();
        if (onCategoriesChanged) await onCategoriesChanged();
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Failed to restore backup');
      }
    } catch (err) {
      console.error(err);
      setBackupStatus({ type: 'error', message: err.message || 'เกิดข้อผิดพลาดในการกู้คืนข้อมูล' });
    } finally {
      setBackupLoading(false);
    }
  };

  const handleResetDatabase = async () => {
    if (user?.isDemo) {
      alert('This is a demo view of the system. Resetting database is disabled.');
      return;
    }
    
    if (window.confirm('⚠️ คำเตือน: คุณแน่ใจหรือไม่ว่าต้องการรีเซ็ตข้อมูลทั้งหมดในระบบ? รายชื่อนักเรียนและคิวตารางเรียนของครูทุกคนจะถูกลบออกทั้งหมด และไม่สามารถกู้คืนได้!')) {
      try {
        setBackupLoading(true);
        setBackupStatus({ type: 'info', message: 'กำลังรีเซ็ตข้อมูลระบบ...' });
        
        const resetData = {
          bookings: [],
          students: [],
          topics: ["Math: Fractions", "Math: Algebra", "English: Grammar", "Science: Forces"],
          categories: ["งานสอน"]
        };
        
        const res = await apiFetch('/api/restore', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(resetData)
        });
        
        if (res.ok) {
          setBackupStatus({ 
            type: 'success', 
            message: 'รีเซ็ตข้อมูลทั้งหมดเรียบร้อยแล้ว! ระบบเริ่มเก็บค่าใหม่' 
          });
          
          // Clear auto backup local cache for current user to avoid restoring old data
          const activeEmail = user?.email;
          if (activeEmail) {
            localStorage.removeItem(`jadsans_auto_backup_${activeEmail}`);
          }
          
          if (onStudentsChanged) await onStudentsChanged();
          if (onBookingsChanged) await onBookingsChanged();
          if (onCategoriesChanged) await onCategoriesChanged();
        } else {
          const err = await res.json();
          throw new Error(err.error || 'Failed to reset database');
        }
      } catch (err) {
        console.error(err);
        setBackupStatus({ type: 'error', message: err.message || 'เกิดข้อผิดพลาดในการรีเซ็ตข้อมูล' });
      } finally {
        setBackupLoading(false);
      }
    }
  };
  
  // Modal states for details/editing
  const [activeDetailBooking, setActiveDetailBooking] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editClassName, setEditClassName] = useState('');
  const [editStudentName, setEditStudentName] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editClassType, setEditClassType] = useState('Onsite');
  const [editDate, setEditDate] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editError, setEditError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const availableYears = [];
  const startYear = 2024;
  for (let i = 0; i < 10; i++) {
    availableYears.push(startYear + i);
  }

  // Derive unique list of students from all bookings
  const uniqueStudents = Array.from(new Set(bookings.map(b => b.student_name))).sort();

  const getDynamicCategories = () => {
    // Basic defaults with colors
    const defaultColorMap = {
      'งานสอน': '#10b981',
      'งานประชุม': '#f59e0b',
      'งานประกัน': '#0ea5e9',
      'งานนัดลูกค้า': '#f43f5e'
    };

    const baseList = Array.isArray(categories) && categories.length > 0 ? categories : ['งานสอน'];
    
    // Union with any category present in students or bookings
    const studentCats = students.map(s => s.category).filter(Boolean);
    const bookingCats = bookings.map(b => b.class_name).filter(Boolean);
    const allNames = Array.from(new Set([...baseList, ...studentCats, ...bookingCats]));

    // Generate color-coded category objects
    const customColors = ['#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e', '#a855f7'];
    let customColorIndex = 0;

    return allNames.map(name => {
      if (defaultColorMap[name]) {
        return { name, color: defaultColorMap[name] };
      }
      const color = customColors[customColorIndex % customColors.length];
      customColorIndex++;
      return { name, color };
    });
  };
  const dynamicCategories = getDynamicCategories();

  // Handle master grid calculations
  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();

  const daysInCurrentMonth = getDaysInMonth(year, month);
  const firstDayIndex = getFirstDayOfMonth(year, month);

  // Month navigation
  const navigateMonth = (delta) => {
    setCurrentDate(new Date(year, month + delta, 1));
  };

  // Generate calendar days for master monthly grid
  const prevMonthIndex = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const daysInPrevMonth = getDaysInMonth(prevYear, prevMonthIndex);
  
  const masterCells = [];

  // Padded prev month
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const mStr = String(prevMonthIndex + 1).padStart(2, '0');
    const dStr = String(d).padStart(2, '0');
    masterCells.push({
      day: d,
      dateStr: `${prevYear}-${mStr}-${dStr}`,
      currentMonth: false
    });
  }

  // Current month
  for (let d = 1; d <= daysInCurrentMonth; d++) {
    const mStr = String(month + 1).padStart(2, '0');
    const dStr = String(d).padStart(2, '0');
    masterCells.push({
      day: d,
      dateStr: `${year}-${mStr}-${dStr}`,
      currentMonth: true
    });
  }

  // Padded next month
  const remainingCells = 42 - masterCells.length;
  const nextMonthIndex = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;
  for (let d = 1; d <= remainingCells; d++) {
    const mStr = String(nextMonthIndex + 1).padStart(2, '0');
    const dStr = String(d).padStart(2, '0');
    masterCells.push({
      day: d,
      dateStr: `${nextYear}-${mStr}-${dStr}`,
      currentMonth: false
    });
  }

  // Format date presentation
  const formatDateDisplay = (dateStr) => {
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  // Setup modal for editing
  const handleOpenDetail = (booking) => {
    if (!user) return; // Guard clause for logged out users
    setActiveDetailBooking(booking);
    setIsEditing(false);
    setEditClassName(booking.class_name);
    setEditStudentName(booking.student_name);
    setEditLocation(booking.location || '');
    setEditClassType(booking.class_type || 'Onsite');
    setEditDate(booking.date);
    setEditStartTime(booking.start_time);
    setEditEndTime(booking.end_time);
    setEditNotes(booking.notes || '');
    setEditColor(booking.color || 'hsl(260, 85%, 65%)');
    setEditError('');
  };

  // Perform Update request
  const handleSaveEdit = async () => {
    if (user?.isDemo) {
      alert('This is a demo view of the system. Modifying data is disabled.');
      return;
    }
    if (!editClassName.trim() || !editStudentName.trim() || !editDate || !editStartTime || !editEndTime) {
      setEditError('Please fill in all required fields.');
      return;
    }
    if (editStartTime >= editEndTime) {
      setEditError('Start time must be earlier than end time.');
      return;
    }

    setActionLoading(true);
    setEditError('');

    try {
      const response = await apiFetch(`/api/bookings/${activeDetailBooking.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          class_name: editClassName,
          student_name: editStudentName,
          date: editDate,
          start_time: editStartTime,
          end_time: editEndTime,
          notes: editNotes,
          color: editColor,
          location: editLocation,
          class_type: editClassType
        })
      });

      if (response.ok) {
        const updated = await response.json();
        setActiveDetailBooking(null);
        setIsEditing(false);
        if (onBookingsChanged) onBookingsChanged();
      } else {
        const err = await response.json();
        setEditError(err.error || 'Failed to update schedule');
      }
    } catch (err) {
      console.error(err);
      setEditError('Network error updating schedule.');
    } finally {
      setActionLoading(false);
    }
  };

  // Perform Delete request
  const handleDeleteBooking = async (id) => {
    if (user?.isDemo) {
      alert('This is a demo view of the system. Modifying data is disabled.');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this schedule? This will also remove it from Google Calendar if synced.')) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await apiFetch(`/api/bookings/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setActiveDetailBooking(null);
        if (onBookingsChanged) onBookingsChanged();
      } else {
        alert('Failed to delete schedule');
      }
    } catch (err) {
      console.error(err);
      alert('Network error deleting schedule.');
    } finally {
      setActionLoading(false);
    }
  };

  // --- Mini Calendar generation helper ---
  const renderMiniCalendar = (offset) => {
    const miniDate = new Date(year, month + offset, 1);
    const mY = miniDate.getFullYear();
    const mM = miniDate.getMonth();
    const days = getDaysInMonth(mY, mM);
    const startIdx = getFirstDayOfMonth(mY, mM);
    const title = miniDate.toLocaleString('default', { month: 'short' }) + ' ' + mY;

    const cells = [];
    for (let i = 0; i < startIdx; i++) cells.push({ day: '', booked: false });
    for (let d = 1; d <= days; d++) {
      const mStr = String(mM + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      const dKey = `${mY}-${mStr}-${dStr}`;
      const hasBooking = bookings.some(b => b.date === dKey);
      cells.push({ day: d, booked: hasBooking });
    }

    return (
      <div className="mini-cal-panel">
        <h4 className="mini-cal-title">{title}</h4>
        <div className="mini-cal-grid">
          {['S','M','T','W','T','F','S'].map((d, i) => (
            <span key={i} style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textAlign: 'center', fontWeight: 'bold' }}>{d}</span>
          ))}
          {cells.map((c, i) => (
            <span 
              key={i} 
              className={`mini-day ${c.booked ? 'active-booking' : ''}`}
              style={{
                fontSize: '0.6rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                aspectRatio: '1',
                borderRadius: '2px',
                background: c.booked ? 'var(--primary)' : 'transparent',
                color: c.booked ? '#fff' : 'var(--text-secondary)'
              }}
            >
              {c.day}
            </span>
          ))}
        </div>
      </div>
    );
  };

  const isUserLoggedIn = !!user;
  const shareUrl = user 
    ? `${window.location.origin}/?shared=true&owner=${encodeURIComponent(user.email)}`
    : `${window.location.origin}/?shared=true`;

  return (
    <div 
      className="master-grid" 
      style={{ 
        display: 'grid', 
        gridTemplateColumns: isUserLoggedIn ? undefined : '1fr',
        gap: '24px', 
        height: '100%', 
        overflowY: 'auto', 
        paddingRight: '4px', 
        boxSizing: 'border-box' 
      }}
    >
      
      {/* Calendar Area */}
      <div className="glass-card" style={{ padding: '24px' }}>
        
        {/* Navigation & Header */}
        <div className="master-header">
          <div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <RoundedDropdown
                value={month}
                onChange={val => setCurrentDate(new Date(year, val, 1))}
                options={monthNames.map((mName, idx) => ({ value: idx, label: mName }))}
                style={{ width: '160px' }}
              />

              <RoundedDropdown
                value={year}
                onChange={val => setCurrentDate(new Date(val, month, 1))}
                options={availableYears.map(y => ({ value: y, label: y.toString() }))}
                style={{ width: '110px' }}
              />
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Showing {bookings.length} total scheduled event(s)
            </p>
          </div>
          
          <div className="calendar-nav-buttons" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isUserLoggedIn && (
              <>
                <button
                  className="nav-arrow-btn"
                  onClick={() => {
                    setBackupStatus({ type: '', message: '' });
                    setShowBackupModal(true);
                  }}
                  title="Backup & Restore Data"
                  style={{ width: 'auto', padding: '0 12px', gap: '6px', color: 'var(--secondary-light)', borderColor: 'rgba(99, 102, 241, 0.2)' }}
                >
                  <Database size={15} />
                  <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>Backup</span>
                </button>

                <button
                  className="nav-arrow-btn"
                  onClick={() => setShowShareModal(true)}
                  title="Share Calendar"
                  style={{ width: 'auto', padding: '0 12px', gap: '6px', color: 'var(--primary-light)', borderColor: 'rgba(16, 185, 129, 0.2)' }}
                >
                  <Share2 size={15} />
                  <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>Share</span>
                </button>
              </>
            )}
            <button className="nav-arrow-btn" onClick={() => navigateMonth(-1)} title="Previous Month">&lt;</button>
            <button className="nav-arrow-btn" onClick={() => navigateMonth(1)} title="Next Month">&gt;</button>
          </div>
        </div>

        {/* Master Month View Grid */}
        <div className="month-grid" style={{ gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', marginTop: '16px' }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="weekday-header" style={{ fontSize: '0.8rem' }}>
              <span className="weekday-long">{day}</span>
              <span className="weekday-short">{day.slice(0, 3)}</span>
              <span className="weekday-tiny">{day.slice(0, 1)}</span>
            </div>
          ))}
          
          {loading ? (
            <div style={{ gridColumn: 'span 7', textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
              Loading schedules...
            </div>
          ) : masterCells.map((cell, idx) => {
            const isToday = cell.dateStr === getLocalDateString();
            
            // Filter bookings for this day matching selected filters
            const bookingsForDay = bookings.filter(b => {
              const matchesDate = b.date === cell.dateStr;
              const matchesCategory = !selectedCategoryFilter || b.class_name === selectedCategoryFilter;
              const matchesStudent = !selectedStudentFilter || b.student_name === selectedStudentFilter;
              return matchesDate && matchesCategory && matchesStudent;
            });
            const hasMore = bookingsForDay.length > 3;
            const itemsToShow = hasMore ? bookingsForDay.slice(0, 3) : bookingsForDay;

            return (
              <div 
                key={idx} 
                className={`master-day-cell ${cell.currentMonth ? '' : 'inactive'} ${isToday ? 'today' : ''}`}
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  setModalDateStr(cell.dateStr);
                  setShowDayEventsModal(true);
                }}
              >
                <div className="day-header">
                  <span className="day-num" style={{ opacity: cell.currentMonth ? 1 : 0.4 }}>{cell.day}</span>
                  {isToday && <span style={{ fontSize: '0.6rem', color: 'var(--secondary-light)', fontWeight: 'bold', background: 'rgba(99, 102, 241, 0.15)', padding: '1px 4px', borderRadius: '3px' }}>Today</span>}
                </div>

                <div className="master-bookings-container">
                  {itemsToShow.map(b => {
                    const itemColor = b.color || 'hsl(260, 85%, 65%)';
                    const bg = itemColor.replace(')', ', 0.15)');
                    
                    const checkIsPast = (dateStr, endTimeStr) => {
                      const today = new Date();
                      const todayStr = getLocalDateString(today);
                      if (dateStr < todayStr) return true;
                      if (dateStr > todayStr) return false;
                      const currentHHMM = `${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}`;
                      return endTimeStr < currentHHMM;
                    };
                    const isPast = checkIsPast(b.date, b.end_time);
                    const isDone = b.status === 'done';
                    const isCancelled = b.status === 'cancelled';
                    const isRescheduled = b.status === 'rescheduled';
                    
                    let displayColor, displayBg, displayTextColor;
                    if (isCancelled) {
                      displayColor = '#ef4444';
                      displayBg = 'rgba(239, 68, 68, 0.12)';
                      displayTextColor = '#f87171';
                    } else if (isPast || isDone) {
                      displayColor = '#10b981';
                      displayBg = 'rgba(16, 185, 129, 0.12)';
                      displayTextColor = '#34d399';
                    } else if (isRescheduled) {
                      displayColor = '#f59e0b';
                      displayBg = 'rgba(245, 158, 11, 0.12)';
                      displayTextColor = '#fbbf24';
                    } else {
                      displayColor = itemColor;
                      displayBg = bg;
                      displayTextColor = 'var(--text-primary)';
                    }
                    
                    return (
                      <div
                        key={b.id}
                        className="class-block-item"
                        style={{
                          background: displayBg,
                          borderColor: displayColor,
                          color: displayTextColor,
                          borderLeft: `3px solid ${displayColor}`,
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (user) {
                            handleOpenDetail(b);
                          } else {
                            setModalDateStr(cell.dateStr);
                            setShowDayEventsModal(true);
                          }
                        }}
                        title={`${b.class_name} (${b.student_name})`}
                      >
                        {b.start_time}-{b.end_time} {isDone && '✓'}
                      </div>
                    );
                  })}
                  {hasMore && (
                    <div
                      style={{
                        fontSize: '0.58rem',
                        color: 'var(--primary)',
                        fontWeight: '600',
                        cursor: 'pointer',
                        padding: '1px 4px',
                        borderRadius: '2px',
                        background: 'rgba(139,92,246,0.1)',
                        textAlign: 'center',
                        marginTop: '2px'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setModalDateStr(cell.dateStr);
                        setShowDayEventsModal(true);
                      }}
                    >
                      +{bookingsForDay.length - 3} เพิ่มเติม
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sidebar Panel */}
      {isUserLoggedIn && (
        <div className="student-sidebar-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Category Filter Sidebar Widget */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px', marginBottom: '12px' }}>
              <Tag size={16} color="var(--primary-light)" />
              <h3 className="sidebar-title">Filter Category</h3>
            </div>

            <div className="student-list-container">
              <button
                className={`student-filter-btn ${selectedCategoryFilter === null ? 'active' : ''}`}
                onClick={() => setSelectedCategoryFilter(null)}
              >
                <span>Show All Categories</span>
                <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                  ({students.length})
                </span>
              </button>

              {dynamicCategories.map(cat => {
                const count = students.filter(s => (s.category || 'งานสอน') === cat.name).length;
                const isActive = selectedCategoryFilter === cat.name;

                return (
                  <button
                    key={cat.name}
                    className={`student-filter-btn ${isActive ? 'active' : ''}`}
                    onClick={() => setSelectedCategoryFilter(cat.name)}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="student-color-pill" style={{ background: cat.color, boxShadow: `0 0 6px ${cat.color}` }} />
                      {cat.name}
                    </span>
                    <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>({count})</span>
                  </button>
                );
              })}
            </div>

            {/* Student Filter Dropdown Selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '16px', borderTop: '1px solid var(--glass-border)', paddingTop: '16px' }}>
              <label style={{ fontSize: '0.65rem', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>FILTER BY STUDENT / TOPIC</label>
              <CustomSelect
                value={selectedStudentFilter}
                onChange={(val) => setSelectedStudentFilter(val)}
                placeholder="-- ทั้งหมด --"
                options={[
                  { value: null, label: '-- ทั้งหมด --' },
                  ...Array.from(new Set([
                    ...students.filter(s => !selectedCategoryFilter || (s.category || 'งานสอน') === selectedCategoryFilter).map(s => s.name),
                    ...bookings.filter(b => !selectedCategoryFilter || b.class_name === selectedCategoryFilter).map(b => b.student_name)
                  ]))
                    .filter(Boolean)
                    .sort()
                    .map(name => ({ value: name, label: name }))
                ]}
              />
            </div>
          </div>
        </div>
      )}

      {/* Booking Detail & Edit Modal */}
      {activeDetailBooking && (
        <div className="modal-overlay">
          <div className="modal-content">
            
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-display)' }}>
                {isEditing ? 'Edit Schedule Session' : 'Schedule Detail'}
              </h3>
              <button className="modal-close" onClick={() => setActiveDetailBooking(null)}>
                <X size={18} />
              </button>
            </div>

            {editError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', padding: '8px 12px', borderRadius: '4px', border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: '0.85rem', marginBottom: '12px' }}>
                <AlertCircle size={14} />
                <span>{editError}</span>
              </div>
            )}

            <div className="modal-body">
              {isEditing ? (
                // EDIT MODE
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div className="form-group">
                    <label style={{ fontSize: '0.75rem' }} htmlFor="editClassNameInput">CATEGORY</label>
                    <CustomSelect
                      value={editClassName}
                      onChange={(val) => {
                        setEditClassName(val);
                        setEditStudentName('');
                        setEditLocation('');
                        setEditColor('hsl(260, 85%, 65%)');
                      }}
                      options={dynamicCategories.map(c => ({ value: c, label: c }))}
                      onEditOption={async (opt) => {
                        const newName = window.prompt(`แก้ไขชื่อหมวดหมู่ "${opt.label}" เป็น:`, opt.label);
                        if (newName && newName.trim() && newName.trim() !== opt.label) {
                          try {
                            const res = await apiFetch(`/api/categories/${encodeURIComponent(opt.value)}`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ newName: newName.trim() })
                            });
                            if (res.ok) {
                              if (onStudentsChanged) await onStudentsChanged();
                              if (onBookingsChanged) await onBookingsChanged();
                              if (onCategoriesChanged) await onCategoriesChanged();
                              setEditClassName(newName.trim());
                            } else {
                              alert('ไม่สามารถแก้ไขชื่อหมวดหมู่ได้');
                            }
                          } catch (err) {
                            console.error(err);
                          }
                        }
                      }}
                      onDeleteOption={async (opt) => {
                        if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบหมวดหมู่ "${opt.label}"? การลบจะทำลายรายชื่อและตารางงานทั้งหมดในหมวดหมู่นี้!`)) {
                          try {
                            const res = await apiFetch(`/api/categories/${encodeURIComponent(opt.value)}`, { method: 'DELETE' });
                            if (res.ok) {
                              if (onStudentsChanged) await onStudentsChanged();
                              if (onBookingsChanged) await onBookingsChanged();
                              if (onCategoriesChanged) await onCategoriesChanged();
                              setEditClassName('งานสอน');
                              setEditStudentName('');
                            } else {
                              alert('ไม่สามารถลบหมวดหมู่ได้');
                            }
                          } catch (err) {
                            console.error(err);
                          }
                        }
                      }}
                    />
                  </div>

                  {/* Color picker removed in favor of student profile color linkage */}

                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <label style={{ fontSize: '0.75rem' }} htmlFor="editStudentNameSelect">{getStudentLabel(editClassName)}</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>Color:</span>
                        <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: editColor, border: '1px solid #fff' }} />
                      </div>
                    </div>
                    <CustomSelect
                      value={editStudentName}
                      onChange={(val) => {
                        setEditStudentName(val);
                        const s = students.find(stud => stud.name === val);
                        setEditLocation(s ? s.location : '');
                        setEditColor(s ? s.color : 'hsl(260, 85%, 65%)');
                      }}
                      placeholder={getStudentPlaceholder(editClassName)}
                      options={students
                        .filter(s => (s.category || 'งานสอน') === editClassName)
                        .map(s => ({ value: s.name, label: s.name, id: s.id }))
                      }
                      onEditOption={async (opt) => {
                        if (user?.isDemo) {
                          alert('This is a demo view of the system. Modifying options is disabled.');
                          return;
                        }
                        const newName = window.prompt(`แก้ไขรายชื่อ "${opt.label}" เป็น:`, opt.label);
                        if (newName && newName.trim() && newName.trim() !== opt.label) {
                          try {
                            const res = await apiFetch(`/api/students/${opt.id}`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ name: newName.trim() })
                            });
                            if (res.ok) {
                              if (onStudentsChanged) await onStudentsChanged();
                              if (editStudentName === opt.value) {
                                setEditStudentName(newName.trim());
                              }
                            } else {
                              alert('ไม่สามารถแก้ไขรายชื่อได้');
                            }
                          } catch (err) {
                            console.error(err);
                          }
                        }
                      }}
                      onDeleteOption={async (opt) => {
                        if (user?.isDemo) {
                          alert('This is a demo view of the system. Modifying options is disabled.');
                          return;
                        }
                        if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบรายชื่อ "${opt.label}"?`)) {
                          try {
                            const res = await apiFetch(`/api/students/${opt.id}`, { method: 'DELETE' });
                            if (res.ok) {
                              if (onStudentsChanged) await onStudentsChanged();
                              if (editStudentName === opt.value) {
                                setEditStudentName('');
                              }
                            } else {
                              alert('ไม่สามารถลบรายชื่อได้');
                            }
                          } catch (err) {
                            console.error(err);
                          }
                        }
                      }}
                    />
                    {editStudentName && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        📍 สถานที่เรียน: <strong style={{ color: 'var(--primary-light)' }}>{editLocation || 'ไม่ได้ระบุสถานที่'}</strong>
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '0.75rem' }} htmlFor="editClassTypeSelect">CLASS TYPE</label>
                    <select
                      id="editClassTypeSelect"
                      value={editClassType}
                      onChange={(e) => setEditClassType(e.target.value)}
                    >
                      <option value="Online">Online</option>
                      <option value="Onsite">Onsite</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '0.75rem' }} htmlFor="editDateInput">Date</label>
                    <input
                      id="editDateInput"
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label style={{ fontSize: '0.75rem' }} htmlFor="editStartTimeInput">Start</label>
                      <select
                        id="editStartTimeInput"
                        value={editStartTime}
                        onChange={(e) => setEditStartTime(e.target.value)}
                      >
                        {START_TIME_OPTIONS.map((timeVal) => (
                          <option key={timeVal} value={timeVal}>
                            {timeVal.replace(':', '.')}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: '0.75rem' }} htmlFor="editEndTimeInput">End</label>
                      <select
                        id="editEndTimeInput"
                        value={editEndTime}
                        onChange={(e) => setEditEndTime(e.target.value)}
                      >
                        {END_TIME_OPTIONS.map((timeVal) => (
                          <option key={timeVal} value={timeVal}>
                            {timeVal.replace(':', '.')}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '0.75rem' }} htmlFor="editNotesInput">Notes</label>
                    <textarea
                      id="editNotesInput"
                      rows="2"
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                // DETAIL DISPLAY MODE
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>CATEGORY</span>
                    <span style={{ fontSize: '1.05rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: activeDetailBooking.color || 'hsl(260, 85%, 65%)', border: '1px solid rgba(255,255,255,0.15)' }} />
                      {activeDetailBooking.class_name}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{getStudentLabel(activeDetailBooking.class_name)}</span>
                    <span style={{ fontSize: '1rem', fontWeight: '500' }}>{activeDetailBooking.student_name}</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>LOCATION</span>
                    <span style={{ fontSize: '1rem', fontWeight: '500', color: 'var(--primary-light)' }}>
                      {activeDetailBooking.location || <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>ไม่ได้ระบุสถานที่</span>}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>CLASS TYPE</span>
                    <span style={{ fontSize: '0.95rem', fontWeight: '600', display: 'flex', alignItems: 'center' }}>
                      <span style={{ 
                        padding: '2px 8px', 
                        borderRadius: '4px', 
                        fontSize: '0.75rem', 
                        background: activeDetailBooking.class_type === 'Online' ? '#3b82f6' : '#10b981', 
                        color: '#fff',
                        fontWeight: '600'
                      }}>
                        {activeDetailBooking.class_type || 'Onsite'}
                      </span>
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '24px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Date</span>
                      <span style={{ fontSize: '0.95rem', fontWeight: '500' }}>{formatDateDisplay(activeDetailBooking.date)}</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Time Slot</span>
                      <span style={{ fontSize: '0.95rem', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary-light)' }}>
                        <Clock size={14} />
                        {activeDetailBooking.start_time} - {activeDetailBooking.end_time}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Notes</span>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.15)', padding: '10px', borderRadius: '4px', border: '1px solid var(--glass-border)' }}>
                      {activeDetailBooking.notes || <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>No notes provided.</span>}
                    </span>
                  </div>

                  {activeDetailBooking.google_event_id && (
                    <div style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(16, 185, 129, 0.05)', padding: '6px 10px', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                      Synced with Google Calendar
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="modal-actions">
              {isEditing ? (
                <>
                  <button 
                    className="btn-secondary" 
                    onClick={() => setIsEditing(false)}
                    disabled={actionLoading}
                  >
                    Cancel
                  </button>
                  <button 
                    className="submit-btn" 
                    style={{ padding: '8px 16px', fontSize: '0.9rem', boxShadow: 'none' }}
                    onClick={handleSaveEdit}
                    disabled={actionLoading}
                  >
                    Save Changes
                  </button>
                </>
              ) : (
                <>
                  <button 
                    className="btn-secondary" 
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', borderColor: '#ef4444', color: '#ef4444' }}
                    onClick={() => handleDeleteBooking(activeDetailBooking.id)}
                    disabled={actionLoading}
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                  <button 
                    className="submit-btn" 
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '0.9rem', boxShadow: 'none' }}
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit size={14} /> Edit
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ── Day Events Modal ── */}
      {showDayEventsModal && (
        <div className="modal-overlay" onClick={() => setShowDayEventsModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', width: '100%', maxWidth: '480px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexShrink: 0 }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#1e293b' }}>
                ตารางงานทั้งหมด ({modalDateStr})
              </h3>
              <button onClick={() => setShowDayEventsModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#64748b', lineHeight: 1 }}>&times;</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', paddingRight: '4px', flex: 1 }}>
              {user ? (
                bookings
                  .filter(b => {
                    const matchesDate = b.date === modalDateStr;
                    const matchesCategory = !selectedCategoryFilter || b.class_name === selectedCategoryFilter;
                    const matchesStudent = !selectedStudentFilter || b.student_name === selectedStudentFilter;
                    return matchesDate && matchesCategory && matchesStudent;
                  })
                  .sort((a, b) => a.start_time.localeCompare(b.start_time))
                  .map(b => (
                    <MasterAgendaBookingCard
                      key={b.id}
                      b={b}
                      user={user}
                      onStatusUpdate={async (booking, newStatus, alreadySaved) => {
                        try {
                          if (!alreadySaved) {
                            const response = await apiFetch(`/api/bookings/${booking.id}`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ ...booking, status: newStatus }),
                            });
                            if (!response.ok) return;
                          }
                          if (onBookingsChanged) {
                            onBookingsChanged();
                          }
                        } catch (err) {
                          console.error(err);
                        }
                      }}
                      onDelete={async (booking) => {
                        if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบงานนัดหมายนี้?')) {
                          try {
                            const response = await apiFetch(`/api/bookings/${booking.id}`, { method: 'DELETE' });
                            if (response.ok) {
                              if (onBookingsChanged) onBookingsChanged();
                              const remaining = bookings.filter(r => r.date === modalDateStr && r.id !== booking.id);
                              if (remaining.length === 0) setShowDayEventsModal(false);
                            }
                          } catch (err) {
                            console.error(err);
                          }
                        }
                      }}
                    />
                  ))
              ) : (
                (() => {
                  const DEFAULT_SLOTS = [
                    { start: '09:00', end: '10:00' },
                    { start: '10:00', end: '11:00' },
                    { start: '11:00', end: '12:00' },
                    { start: '13:00', end: '14:00' },
                    { start: '14:00', end: '15:00' },
                    { start: '15:00', end: '16:00' },
                    { start: '16:00', end: '17:00' },
                    { start: '17:00', end: '18:00' },
                    { start: '18:00', end: '19:00' },
                    { start: '19:00', end: '20:00' }
                  ];
                  const dayBookings = bookings.filter(b => b.date === modalDateStr && b.status !== 'cancelled');
                  return DEFAULT_SLOTS.map((slot, idx) => {
                    const isOccupied = dayBookings.some(b => slot.start < b.end_time && slot.end > b.start_time);
                    return (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          borderRadius: '10px',
                          background: isOccupied ? 'rgba(241, 245, 249, 0.45)' : 'rgba(16, 185, 129, 0.05)',
                          borderLeft: isOccupied ? '4px solid #cbd5e1' : '4px solid #10b981',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                          gap: '12px',
                          boxSizing: 'border-box',
                          width: '100%',
                          opacity: isOccupied ? 0.65 : 1
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                          <div 
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center', 
                              width: '28px', 
                              height: '28px', 
                              borderRadius: '50%', 
                              background: isOccupied ? '#f1f5f9' : '#d1fae5', 
                              color: isOccupied ? '#64748b' : '#10b981', 
                              flexShrink: 0 
                            }}
                          >
                            {isOccupied ? <Lock size={13} /> : <Check size={14} />}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: '800', color: isOccupied ? '#475569' : '#047857' }}>
                              {isOccupied ? 'ไม่ว่าง (Unavailable)' : 'ว่างสอน (Available)'}
                            </span>
                            <span style={{ fontSize: '0.68rem', color: '#64748b' }}>
                              {isOccupied ? 'คลาสเวลานี้ถูกจับจองแล้ว' : 'ช่วงเวลาว่าง สามารถติดต่อจองสอนได้'}
                            </span>
                          </div>
                        </div>

                        <div 
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '4px', 
                            fontSize: '0.75rem', 
                            fontWeight: '700', 
                            color: isOccupied ? '#475569' : '#047857', 
                            background: isOccupied ? '#e2e8f0' : '#d1fae5', 
                            padding: '4px 10px', 
                            borderRadius: '6px', 
                            flexShrink: 0 
                          }}
                        >
                          <Clock size={12} style={{ opacity: 0.8 }} />
                          <span>{slot.start} – {slot.end}</span>
                        </div>
                      </div>
                    );
                  });
                })()
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Backup & Restore Modal ── */}
      {showBackupModal && createPortal(
        <div 
          className="modal-overlay" 
          onClick={() => setShowBackupModal(false)} 
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}
        >
          <div 
            className="modal-content" 
            onClick={e => e.stopPropagation()} 
            style={{ 
              background: '#ffffff', 
              border: '1px solid #e2e8f0', 
              borderRadius: '24px', 
              padding: '28px', 
              width: '450px', 
              maxWidth: '90%', 
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Database size={24} color="var(--primary-light)" />
                <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>สำรองและกู้คืนข้อมูล</h2>
              </div>
              <button 
                onClick={() => setShowBackupModal(false)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '0.85rem', color: '#475569' }}>
              {/* Export Backup Section */}
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontWeight: '700', fontSize: '0.9rem', color: '#0f172a', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Download size={16} /> 1. สำรองข้อมูล (Backup)
                </h3>
                <p style={{ margin: '0 0 12px 0', lineHeight: '1.4' }}>
                  ดาวน์โหลดข้อมูลตารางงานนัดหมาย รายชื่อนักเรียน และหมวดหมู่ทั้งหมดเก็บไว้เป็นไฟล์บนคอมพิวเตอร์ของคุณ
                </p>
                <button
                  onClick={handleDownloadBackup}
                  disabled={backupLoading}
                  style={{
                    width: '100%',
                    background: 'var(--gradient-emerald)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '10px',
                    borderRadius: '10px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)',
                    opacity: backupLoading ? 0.7 : 1
                  }}
                >
                  <Download size={16} />
                  ดาวน์โหลดไฟล์สำรองข้อมูล
                </button>
              </div>

              {/* Import Restore Section */}
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontWeight: '700', fontSize: '0.9rem', color: '#0f172a', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Upload size={16} /> 2. กู้คืนข้อมูล (Restore)
                </h3>
                <p style={{ margin: '0 0 12px 0', lineHeight: '1.4' }}>
                  เลือกไฟล์สำรองข้อมูล `.json` ที่คุณดาวน์โหลดเก็บไว้ เพื่อนำคิวนัดหมายและนักเรียนทั้งหมดกลับคืนเข้าระบบ
                </p>
                
                <label
                  style={{
                    width: '100%',
                    background: '#ffffff',
                    color: 'var(--secondary-light)',
                    border: '1.5px dashed rgba(99, 102, 241, 0.4)',
                    padding: '12px',
                    borderRadius: '10px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxSizing: 'border-box',
                    textAlign: 'center',
                    pointerEvents: backupLoading ? 'none' : 'auto',
                    opacity: backupLoading ? 0.7 : 1
                  }}
                >
                  <Upload size={16} />
                  เลือกไฟล์สำรองเพื่อกู้คืน
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleRestoreBackup}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>

              {/* Browser Cache Restore Section */}
              {localStorage.getItem(`jadsans_auto_backup_${user?.email}`) && (
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ fontWeight: '700', fontSize: '0.9rem', color: '#0f172a', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Database size={16} /> 3. กู้คืนจากเบราว์เซอร์ (Auto-Backup)
                  </h3>
                  <p style={{ margin: '0 0 12px 0', lineHeight: '1.4' }}>
                    พบข้อมูลสำรองอัตโนมัติในเบราว์เซอร์นี้ คุณสามารถคลิกเพื่อดึงข้อมูลทั้งหมดเข้าสู่ระบบคลาวด์ได้โดยตรง
                  </p>
                  <button
                    onClick={handleRestoreFromBrowserCache}
                    disabled={backupLoading}
                    style={{
                      width: '100%',
                      background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                      color: '#ffffff',
                      border: 'none',
                      padding: '10px',
                      borderRadius: '10px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      boxShadow: '0 4px 12px rgba(99, 102, 241, 0.15)',
                      opacity: backupLoading ? 0.7 : 1
                    }}
                  >
                    <Database size={16} />
                    ดึงข้อมูลสำรองจากเบราว์เซอร์นี้
                  </button>
                </div>
              )}

              {/* Reset Database Section */}
              <div style={{ background: '#fff1f2', padding: '16px', borderRadius: '16px', border: '1px solid #fecdd3' }}>
                <h3 style={{ fontWeight: '700', fontSize: '0.9rem', color: '#9f1239', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertCircle size={16} color="#9f1239" /> 4. รีเซ็ตระบบ (Reset Database)
                </h3>
                <p style={{ margin: '0 0 12px 0', lineHeight: '1.4', color: '#4f5e71' }}>
                  ล้างข้อมูลตารางเรียน รายชื่อนักเรียน และหัวข้อทั้งหมดเพื่อเริ่มต้นเก็บค่าใหม่
                </p>
                <button
                  onClick={handleResetDatabase}
                  disabled={backupLoading}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '10px',
                    borderRadius: '10px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.15)',
                    opacity: backupLoading ? 0.7 : 1
                  }}
                >
                  <Trash2 size={16} />
                  รีเซ็ตข้อมูลทั้งหมดใหม่
                </button>
              </div>
            </div>

            {/* Status alerts */}
            {backupStatus.message && (
              <div 
                style={{ 
                  padding: '10px 14px', 
                  borderRadius: '10px', 
                  fontSize: '0.8rem', 
                  fontWeight: '600',
                  background: backupStatus.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : backupStatus.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                  color: backupStatus.type === 'success' ? '#10b981' : backupStatus.type === 'error' ? '#ef4444' : '#6366f1',
                  border: `1px solid ${backupStatus.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : backupStatus.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(99, 102, 241, 0.2)'}`,
                  lineHeight: '1.4'
                }}
              >
                {backupStatus.message}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* ── Share Calendar Modal ── */}
      {showShareModal && createPortal(
        <div 
          className="modal-overlay" 
          onClick={() => setShowShareModal(false)} 
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div 
            className="modal-content" 
            onClick={e => e.stopPropagation()} 
            style={{ 
              background: '#ffffff', 
              border: '1px solid #e2e8f0', 
              borderRadius: '20px', 
              padding: '24px', 
              width: '100%', 
              maxWidth: '440px', 
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              textAlign: 'center',
              animation: 'zoomIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              boxSizing: 'border-box'
            }}
          >
            <div style={{ alignSelf: 'stretch', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
                Share Real-Time Calendar
              </h3>
              <button 
                onClick={() => setShowShareModal(false)} 
                style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#64748b', lineHeight: 1 }}
              >
                &times;
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', width: '100%' }}>
              <div style={{ background: '#f0fdf4', color: '#16a34a', padding: '12px', borderRadius: '50%', display: 'inline-flex', justifyContent: 'center', alignItems: 'center' }}>
                <Share2 size={24} />
              </div>

              <div>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 4px 0', lineHeight: '1.4' }}>
                  Anyone with this link can view your real-time schedule. 
                </p>
                <p style={{ fontSize: '0.75rem', color: '#10b981', margin: 0, fontWeight: '600' }}>
                  🔒 Student names and details remain private.
                </p>
              </div>

              {/* QR Code Container */}
              <div 
                style={{ 
                  padding: '12px', 
                  background: '#f8fafc', 
                  border: '1px dashed #cbd5e1', 
                  borderRadius: '12px', 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  width: '150px',
                  height: '150px',
                  boxSizing: 'border-box'
                }}
              >
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=126x126&data=${encodeURIComponent(shareUrl)}`} 
                  alt="Calendar QR Code" 
                  style={{ width: '126px', height: '126px' }}
                />
              </div>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '-8px' }}>
                Scan to view on mobile
              </span>

              {/* URL Input and Copy Button */}
              <div style={{ display: 'flex', width: '100%', gap: '8px', marginTop: '4px' }}>
                <input 
                  type="text" 
                  readOnly 
                  value={shareUrl}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    fontSize: '0.8rem',
                    color: '#475569',
                    outline: 'none',
                    fontFamily: 'monospace'
                  }}
                  onClick={e => e.target.select()}
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(shareUrl);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '10px',
                    border: 'none',
                    background: copied ? '#10b981' : 'var(--gradient-cosmic)',
                    color: '#ffffff',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '90px'
                  }}
                >
                  {copied ? 'Copied!' : 'Copy Link'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}

// ─── Agenda Booking Card for Master View ──────────────────────────────────────
function MasterAgendaBookingCard({ b, user, onStatusUpdate, onDelete }) {
  const isUserLoggedIn = !!user;

  // ── Reschedule Modal State ────────────────────────────────────────────────
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState(b.date);
  const [rescheduleStartTime, setRescheduleStartTime] = useState(b.start_time);
  const [rescheduleEndTime, setRescheduleEndTime] = useState(b.end_time);
  const [rescheduleError, setRescheduleError] = useState('');
  const [rescheduleLoading, setRescheduleLoading] = useState(false);

  const openRescheduleModal = () => {
    setRescheduleDate(b.date);
    setRescheduleStartTime(b.start_time);
    setRescheduleEndTime(b.end_time);
    setRescheduleError('');
    setRescheduleLoading(false);
    setShowRescheduleModal(true);
  };

  const handleRescheduleSubmit = async () => {
    if (rescheduleStartTime >= rescheduleEndTime) {
      setRescheduleError('เวลาเริ่มต้นต้องน้อยกว่าเวลาสิ้นสุด');
      return;
    }
    setRescheduleLoading(true);
    setRescheduleError('');
    try {
      const updatedBooking = { ...b, date: rescheduleDate, start_time: rescheduleStartTime, end_time: rescheduleEndTime, status: 'rescheduled' };
      const response = await apiFetch(`/api/bookings/${b.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedBooking),
      });
      if (response.ok) {
        setShowRescheduleModal(false);
        // Trigger parent refresh (already saved, skip double PUT)
        onStatusUpdate({ ...updatedBooking }, 'rescheduled', true);
      } else {
        const data = await response.json();
        setRescheduleError(data.error || 'ไม่สามารถเลื่อนนัดได้');
      }
    } catch (err) {
      setRescheduleError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setRescheduleLoading(false);
    }
  };

  const checkIsPast = (dateStr, endTimeStr) => {
    const today = new Date();
    const todayStr = getLocalDateString(today);
    if (dateStr < todayStr) return true;
    if (dateStr > todayStr) return false;
    const currentHHMM = `${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}`;
    return endTimeStr < currentHHMM;
  };

  const isPast = checkIsPast(b.date, b.end_time);
  const isDone = b.status === 'done';
  const isRescheduled = b.status === 'rescheduled';
  const isCancelled = b.status === 'cancelled';

  if (!isUserLoggedIn) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          borderRadius: '8px',
          background: 'rgba(241, 245, 249, 0.65)',
          borderLeft: '4px solid #94a3b8',
          boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
          gap: '12px',
          boxSizing: 'border-box',
          marginBottom: '6px',
          width: '100%',
          fontFamily: 'inherit'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '50%', background: '#e2e8f0', color: '#64748b', flexShrink: 0 }}>
            <Lock size={14} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>
              Unavailable
            </span>
            <span style={{ fontSize: '0.68rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              This time slot is busy.
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', fontWeight: '700', color: '#475569', background: '#e2e8f0', padding: '4px 10px', borderRadius: '6px', flexShrink: 0 }}>
          <Clock size={12} style={{ opacity: 0.8 }} />
          <span>{b.start_time} – {b.end_time}</span>
        </div>
      </div>
    );
  }

  // Get status color mappings
  let borderColor, bg, textColor, subTextColor, tagBg;
  if (isCancelled) {
    borderColor = '#ef4444';
    bg = 'rgba(239,68,68,0.06)';
    textColor = '#ef4444';
    subTextColor = '#f87171';
    tagBg = 'rgba(239,68,68,0.1)';
  } else if (isPast || isDone) {
    borderColor = '#10b981';
    bg = 'rgba(16,185,129,0.06)';
    textColor = '#10b981';
    subTextColor = '#34d399';
    tagBg = 'rgba(16,185,129,0.1)';
  } else if (isRescheduled) {
    borderColor = '#f59e0b';
    bg = 'rgba(245,158,11,0.06)';
    textColor = '#d97706';
    subTextColor = '#fbbf24';
    tagBg = 'rgba(245,158,11,0.1)';
  } else {
    borderColor = b.color || 'var(--primary)';
    bg = 'rgba(255,255,255,0.03)';
    textColor = 'var(--text-primary)';
    subTextColor = 'var(--text-secondary)';
    tagBg = 'rgba(255,255,255,0.08)';
  }

  return (
    <>
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 10px',
        borderRadius: '8px',
        background: bg,
        borderLeft: `4px solid ${borderColor}`,
        boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
        gap: '8px',
        boxSizing: 'border-box',
        transition: 'transform 0.15s',
        marginBottom: '6px',
        width: '100%'
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', overflow: 'hidden', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: '700', color: textColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {b.student_name}
          </span>
          <span style={{ fontSize: '0.65rem', background: tagBg, color: textColor, padding: '1px 5px', borderRadius: '4px', fontWeight: '600' }}>
            {b.class_name}
          </span>
          {isDone && (
            <span style={{ fontSize: '0.65rem', background: '#065f46', color: '#34d399', padding: '1px 6px', borderRadius: '4px', fontWeight: '700' }}>✓ เสร็จสิ้น</span>
          )}
          {isRescheduled && !isDone && (
            <span style={{ fontSize: '0.65rem', background: '#78350f', color: '#fbbf24', padding: '1px 6px', borderRadius: '4px', fontWeight: '700' }}>⏳ ขอเลื่อนนัด</span>
          )}
          {isCancelled && (
            <span style={{ fontSize: '0.65rem', background: '#7f1d1d', color: '#f87171', padding: '1px 6px', borderRadius: '4px', fontWeight: '700' }}>✕ ยกเลิกนัดแล้ว</span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.72rem', color: subTextColor }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <Clock size={11} /> {b.start_time} – {b.end_time}
          </span>
          {b.location && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '3px', maxWidth: '120px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }} title={b.location}>
              📍 {b.location}
            </span>
          )}
        </div>

        {b.notes && (
          <span style={{ fontSize: '0.7rem', color: subTextColor, fontStyle: 'italic', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }} title={b.notes}>
            Note: {b.notes}
          </span>
        )}

        {isPast && (
          <div style={{ display: 'flex', gap: '4px', marginTop: '6px', flexWrap: 'wrap' }}>
            {!isDone ? (
              <button
                type="button"
                onClick={() => onStatusUpdate(b, 'done')}
                style={{ background: '#047857', color: '#fff', border: 'none', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '600', cursor: 'pointer' }}
              >
                งานเสร็จ
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onStatusUpdate(b, 'scheduled')}
                style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '600', cursor: 'pointer' }}
              >
                ↩ แก้ไข
              </button>
            )}

            {!isRescheduled ? (
              <button
                type="button"
                onClick={openRescheduleModal}
                style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.35)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '600', cursor: 'pointer' }}
              >
                เลื่อนนัด
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onStatusUpdate(b, 'scheduled')}
                style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.25)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '600', cursor: 'pointer' }}
              >
                ↩ รีเซ็ต
              </button>
            )}

            {!isCancelled ? (
              <button
                type="button"
                onClick={() => onStatusUpdate(b, 'cancelled')}
                style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.35)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '600', cursor: 'pointer' }}
              >
                ยกเลิกนัด
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onStatusUpdate(b, 'scheduled')}
                style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '600', cursor: 'pointer' }}
              >
                ↩ รีเซ็ต
              </button>
            )}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => onDelete(b)}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          padding: '6px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          alignSelf: 'center',
          transition: 'background-color 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
          e.currentTarget.style.color = '#ef4444';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = 'var(--text-muted)';
        }}
        title="Delete Schedule"
      >
        <Trash2 size={13} />
      </button>
    </div>

      {/* ── Reschedule Popup Modal ────────────────────────────────────────── */}
      {showRescheduleModal && createPortal(
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 99999,
            background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'fadeIn 0.2s ease'
          }}
          onClick={() => setShowRescheduleModal(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: '16px', padding: '28px 32px',
              width: '380px', maxWidth: '92vw',
              boxShadow: '0 25px 60px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.06)',
              animation: 'slideUpFade 0.25s ease',
              fontFamily: 'inherit'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <CalendarDays size={18} color="#fff" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: '#0f172a' }}>เลื่อนนัดหมาย</h3>
                  <p style={{ margin: 0, fontSize: '0.72rem', color: '#94a3b8' }}>{b.student_name} • {b.class_name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRescheduleModal(false)}
                style={{
                  background: '#f1f5f9', border: 'none', borderRadius: '8px',
                  width: '30px', height: '30px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Current Schedule Info */}
            <div style={{
              background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '10px',
              padding: '10px 14px', marginBottom: '18px', fontSize: '0.78rem', color: '#92400e'
            }}>
              <div style={{ fontWeight: '600', marginBottom: '4px' }}>📅 ตารางเดิม</div>
              <span>{b.date} &nbsp;|&nbsp; {b.start_time} – {b.end_time}</span>
            </div>

            {/* Date Picker */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>วันที่ใหม่</label>
              <input
                type="date"
                value={rescheduleDate}
                onChange={e => setRescheduleDate(e.target.value)}
                style={{
                  width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0',
                  borderRadius: '10px', fontSize: '0.85rem', color: '#0f172a',
                  outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
                  transition: 'border-color 0.2s'
                }}
                onFocus={e => e.target.style.borderColor = '#f59e0b'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>

            {/* Time Row */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '18px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>เวลาเริ่ม</label>
                <select
                  value={rescheduleStartTime}
                  onChange={e => setRescheduleStartTime(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0',
                    borderRadius: '10px', fontSize: '0.85rem', color: '#0f172a',
                    outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
                    cursor: 'pointer', background: '#fff',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={e => e.target.style.borderColor = '#f59e0b'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                >
                  {START_TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>เวลาสิ้นสุด</label>
                <select
                  value={rescheduleEndTime}
                  onChange={e => setRescheduleEndTime(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0',
                    borderRadius: '10px', fontSize: '0.85rem', color: '#0f172a',
                    outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
                    cursor: 'pointer', background: '#fff',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={e => e.target.style.borderColor = '#f59e0b'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                >
                  {END_TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            {/* Error Message */}
            {rescheduleError && (
              <div style={{
                background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px',
                padding: '10px 14px', marginBottom: '14px', fontSize: '0.78rem', color: '#dc2626',
                display: 'flex', alignItems: 'flex-start', gap: '8px'
              }}>
                <AlertCircle size={15} style={{ flexShrink: 0, marginTop: '1px' }} />
                <span>{rescheduleError}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowRescheduleModal(false)}
                style={{
                  flex: 1, padding: '10px', border: '1.5px solid #e2e8f0', borderRadius: '10px',
                  background: '#fff', color: '#64748b', fontSize: '0.85rem', fontWeight: '600',
                  cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleRescheduleSubmit}
                disabled={rescheduleLoading}
                style={{
                  flex: 1, padding: '10px', border: 'none', borderRadius: '10px',
                  background: rescheduleLoading ? '#d1d5db' : 'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: '#fff', fontSize: '0.85rem', fontWeight: '700',
                  cursor: rescheduleLoading ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit', transition: 'all 0.2s',
                  boxShadow: rescheduleLoading ? 'none' : '0 4px 12px rgba(245,158,11,0.35)'
                }}
                onMouseEnter={e => { if (!rescheduleLoading) e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                {rescheduleLoading ? 'กำลังบันทึก...' : '📅 ยืนยันเลื่อนนัด'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
