import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Calendar as CalendarIcon, Clock, Trash2, Save, AlertCircle, Sparkles, ChevronLeft, ChevronRight, ChevronDown, Plus, X, Check, MapPin, Edit } from 'lucide-react';
import { apiFetch } from '../api';

const getLocalDateString = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// ─── Constants ────────────────────────────────────────────────────────────────
const AVAILABLE_COLORS = (() => {
  const colors = [];
  const hues = [0, 25, 45, 75, 110, 145, 175, 195, 215, 235, 255, 275, 295, 315, 335, 350];
  const lightnesses = [40, 52, 64, 76];
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
    if (h < 20) options.push(`${hStr}:30`);
  }
  return options;
})();

const END_TIME_OPTIONS = (() => {
  const options = [];
  for (let h = 9; h <= 24; h++) {
    const hStr = String(h).padStart(2, '0');
    options.push(`${hStr}:00`);
    if (h < 24) options.push(`${hStr}:30`);
  }
  return options;
})();

const CLASS_NAMES = ['งานสอน', 'งานประชุม', 'งานประกัน', 'งานนัดลูกค้า'];
const CLASS_TYPES = ['Onsite', 'Online'];

const getStudentLabel = (category) => {
  switch (category) {
    case 'งานสอน': return 'STUDENT NAME';
    case 'งานประชุม': return 'MEETING TOPIC';
    case 'งานประกัน': return 'INSURANCE TOPIC';
    case 'งานนัดลูกค้า': return 'CLIENT NAME';
    default: return 'NAME';
  }
};

const getStudentPlaceholder = (category) => {
  switch (category) {
    case 'งานสอน': return '-- เลือกรายชื่อนักเรียน --';
    case 'งานประชุม': return '-- เลือกหัวข้อประชุม --';
    case 'งานประกัน': return '-- เลือกหัวข้องานประกัน --';
    case 'งานนัดลูกค้า': return '-- เลือกชื่อลูกค้า --';
    default: return '-- เลือก --';
  }
};

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const THAI_MONTH_NAMES = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];

const PASTEL_COLORS = [
  '#ffb3c6', '#ffc6ff', '#ffd1dc', '#ffcdd2', '#ffe5d9', '#ffdac1', '#ffd8be', '#ffe0b2',
  '#fff9db', '#fff5cc', '#fff9c4', '#f0f4c3', '#d8f3dc', '#d1fae5', '#c8e6c9', '#e8f5e9',
  '#e0f7fa', '#e0f2f1', '#b2dfdb', '#c7f9cc', '#e3f2fd', '#bbdefb', '#d0ebff', '#b3e5fc',
  '#ebd9fc', '#f3e8ff', '#e8def8', '#d1c4e9', '#f8bbd0', '#e1bee7', '#f0f4f8', '#e2e8f0'
];

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

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
const getFirstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();

const formatTimetableDate = (dateStr) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${parseInt(d, 10)} ${THAI_MONTH_NAMES[parseInt(m, 10) - 1]} ${y}`;
};

const checkIsPast = (dateStr, endTimeStr) => {
  if (!dateStr || !endTimeStr) return false;
  const today = new Date();
  const todayStr = getLocalDateString(today);
  if (dateStr < todayStr) return true;
  if (dateStr > todayStr) return false;
  const currentHHMM = `${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}`;
  return endTimeStr < currentHHMM;
};

// ─── Status helpers ───────────────────────────────────────────────────────────
const getStatusColors = (b) => {
  const isPast = checkIsPast(b.date, b.end_time);
  const isDone = b.status === 'done';
  const isRescheduled = b.status === 'rescheduled';
  const isCancelled = b.status === 'cancelled';

  if (isCancelled) {
    return {
      borderColor: '#ef4444',
      bg: 'rgba(239, 68, 68, 0.08)',
      textColor: '#f87171',
      subTextColor: '#ef4444',
      tagBg: 'rgba(239, 68, 68, 0.15)',
    };
  }
  if (isDone || (isPast && !isRescheduled)) {
    return {
      borderColor: '#10b981',
      bg: 'rgba(16, 185, 129, 0.08)',
      textColor: '#34d399',
      subTextColor: '#10b981',
      tagBg: 'rgba(16, 185, 129, 0.15)',
    };
  }
  if (isRescheduled) {
    return {
      borderColor: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.08)',
      textColor: '#fbbf24',
      subTextColor: '#f59e0b',
      tagBg: 'rgba(245, 158, 11, 0.15)',
    };
  }
  return {
    borderColor: b.color || 'var(--primary)',
    bg: 'rgba(255,255,255,0.02)',
    textColor: 'var(--text-primary)',
    subTextColor: 'var(--text-muted)',
    tagBg: b.color ? b.color.replace(')', ', 0.15)') : 'rgba(255,255,255,0.08)',
  };
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function BookingView({ bookings = [], students = [], categories = [], onStudentsChanged, onCategoriesChanged, user, onBookingCreated, onLoginRequested }) {

  // Calendar navigation
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState('');

  // Form fields
  const [className, setClassName] = useState('งานสอน');
  const [studentName, setStudentName] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [notes, setNotes] = useState('');
  const [studentLocation, setStudentLocation] = useState('');
  const [classType, setClassType] = useState('Onsite');
  const [selectedColor, setSelectedColor] = useState(AVAILABLE_COLORS[9]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showDayEventsModal, setShowDayEventsModal] = useState(false);
  const [modalDateStr, setModalDateStr] = useState('');

  // New student form / popup modal
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [newStudentInputValue, setNewStudentInputValue] = useState('');
  const [newStudentLocation, setNewStudentLocation] = useState('');
  const [newStudentColor, setNewStudentColor] = useState(PASTEL_COLORS[0]);
  const [modalCategory, setModalCategory] = useState('งานสอน');
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [isAddingCustomCategory, setIsAddingCustomCategory] = useState(false);

  const newStudentInputRef = useRef(null);

  useEffect(() => {
    if (showAddStudentModal) {
      setModalCategory(className);
      setCustomCategoryInput('');
      setIsAddingCustomCategory(false);
    }
  }, [showAddStudentModal, className]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const getDynamicCategories = () => {
    const rawDefaults = Array.isArray(categories) && categories.length > 0 ? categories : ['งานสอน'];
    const defaults = rawDefaults.map(c => typeof c === 'string' ? c : (c?.name || ''));
    const studentCats = students.map(s => s.category).filter(Boolean);
    const bookingCats = bookings.map(b => b.class_name).filter(Boolean);
    return Array.from(new Set([...defaults, ...studentCats, ...bookingCats]));
  };
  const dynamicCategories = getDynamicCategories();

  // ── Calendar cells ──
  const daysInCurrentMonth = getDaysInMonth(year, month);
  const firstDayIndex = getFirstDayOfMonth(year, month);
  const prevMonthIndex = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const daysInPrevMonth = getDaysInMonth(prevYear, prevMonthIndex);
  const calendarCells = [];

  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    calendarCells.push({ day: d, dateStr: `${prevYear}-${String(prevMonthIndex + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`, currentMonth: false });
  }
  for (let d = 1; d <= daysInCurrentMonth; d++) {
    calendarCells.push({ day: d, dateStr: `${year}-${String(month + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`, currentMonth: true });
  }
  const nextMonthIndex = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;
  for (let d = 1; d <= 42 - calendarCells.length; d++) {
    calendarCells.push({ day: d, dateStr: `${nextYear}-${String(nextMonthIndex + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`, currentMonth: false });
  }

  const changeMonth = (delta) => setCurrentDate(new Date(year, month + delta, 1));

  // ── Status update helper ──
  const updateBookingStatus = async (b, newStatus) => {
    if (user?.isDemo) {
      alert('This is a demo view of the system. Modifying status is disabled.');
      return;
    }
    try {
      const response = await apiFetch(`/api/bookings/${b.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...b, status: newStatus }),
      });
      if (response.ok) {
        if (onBookingCreated) await onBookingCreated();
        if (newStatus === 'done') {
          setSuccessMsg(`บันทึกสถานะ "งานเสร็จ" เรียบร้อยแล้ว ✓`);
        } else if (newStatus === 'rescheduled') {
          setSuccessMsg(`บันทึกสถานะ "ขอเลื่อนนัด" เรียบร้อยแล้ว`);
        } else {
          setSuccessMsg(`รีเซ็ตสถานะงานเรียบร้อยแล้ว`);
        }
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        alert('ไม่สามารถอัปเดตสถานะงานได้');
      }
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    }
  };

  const handleDeleteBooking = async (b, afterDelete) => {
    if (user?.isDemo) {
      alert('This is a demo view of the system. Deleting bookings is disabled.');
      return;
    }
    try {
      const response = await apiFetch(`/api/bookings/${b.id}`, { method: 'DELETE' });
      if (response.ok) {
        if (onBookingCreated) await onBookingCreated();
        if (afterDelete) afterDelete();
      } else {
        alert('ไม่สามารถลบตารางงานได้');
      }
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    }
  };

  // ── Save booking ──
  const handleSave = async () => {
    if (!selectedDateStr) { setErrorMsg('กรุณาเลือกวันที่บนปฏิทินก่อน'); return; }
    if (!className) { setErrorMsg('กรุณาเลือกหมวดหมู่งาน'); return; }
    if (!studentName) { setErrorMsg('กรุณาเลือกชื่อผู้เรียน/รายละเอียด'); return; }
    if (!startTime || !endTime) { setErrorMsg('กรุณาระบุเวลาเริ่มและสิ้นสุด'); return; }
    if (startTime >= endTime) { setErrorMsg('เวลาสิ้นสุดต้องหลังเวลาเริ่มต้น'); return; }

    if (user?.isDemo) {
      alert('This is a demo view of the system. Modifying bookings is disabled.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const body = { class_name: className, student_name: studentName, date: selectedDateStr, start_time: startTime, end_time: endTime, notes, color: selectedColor, location: studentLocation, class_type: classType };
      const res = await apiFetch('/api/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { setErrorMsg(data.error || 'เกิดข้อผิดพลาด'); setLoading(false); return; }
      if (onBookingCreated) await onBookingCreated();
      setSuccessMsg(`บันทึกสำเร็จ! ${className} - ${studentName} (${startTime}–${endTime})`);
      setTimeout(() => setSuccessMsg(''), 5000);
      setStudentName('');
      setNotes('');
    } catch (err) {
      setErrorMsg('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    } finally {
      setLoading(false);
    }
  };

  // ── Add new student ──
  const handleAddNewStudent = async () => {
    if (user?.isDemo) {
      alert('This is a demo view of the system. Modifying options is disabled.');
      return;
    }
    const name = newStudentInputValue.trim();
    if (!name) return;
    
    const finalCategory = isAddingCustomCategory ? customCategoryInput.trim() : modalCategory;
    if (isAddingCustomCategory && !finalCategory) {
      alert('กรุณากรอกชื่อหมวดหมู่ใหม่');
      return;
    }

    try {
      const res = await apiFetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, category: finalCategory, color: newStudentColor, location: '' }),
      });
      if (res.ok) {
        if (onStudentsChanged) await onStudentsChanged();
        setClassName(finalCategory);
        setStudentName(name);
        setSelectedColor(newStudentColor);
        setNewStudentInputValue('');
        setCustomCategoryInput('');
        setIsAddingCustomCategory(false);
        setShowAddStudentModal(false);
      } else {
        const data = await res.json();
        alert(data.error || 'ไม่สามารถเพิ่มรายชื่อได้');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStudentSelect = (val) => {
    setStudentName(val);
    const match = students.find(s => s.name === val && (s.category || 'งานสอน') === className);
    if (match) {
      if (match.color) setSelectedColor(match.color);
      if (match.location) setStudentLocation(match.location);
    }
  };

  // ── Derived data ──
  const todayStr = getLocalDateString();
  const selectedDateBookings = bookings.filter(b => b.date === selectedDateStr).sort((a, b) => a.start_time.localeCompare(b.start_time));

  // ── Render ────────────────────────────────────────────────────────────────
  const monthOptions = MONTH_NAMES.map((name, idx) => ({ value: idx, label: name }));
  const yearOptions = Array.from({ length: 16 }, (_, i) => 2020 + i).map(y => ({ value: y, label: String(y) }));

  return (
    <div className="booking-view-layout-container">

      {/* ── Left: Calendar ── */}
      <div style={{ flex: '0 0 calc(65% - 8px)', width: 'calc(65% - 8px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '16px' }}>

          {/* Month navigation */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexShrink: 0 }}>
            <button onClick={() => changeMonth(-1)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}>
              <ChevronLeft size={18} />
            </button>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '220px' }}>
              <CustomSelect
                value={month}
                onChange={val => setCurrentDate(new Date(year, val, 1))}
                options={monthOptions}
                style={{ flex: 1 }}
              />
              <CustomSelect
                value={year}
                onChange={val => setCurrentDate(new Date(val, month, 1))}
                options={yearOptions}
                style={{ flex: 1 }}
              />
            </div>
            <button onClick={() => changeMonth(1)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}>
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '4px', flexShrink: 0 }}>
            {DAY_LABELS.map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: '0.65rem', fontWeight: '600', color: 'var(--text-muted)', padding: '4px 0' }}>{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridTemplateRows: 'repeat(6, 1fr)', gap: '2px', flex: 1, overflow: 'hidden' }}>
            {calendarCells.map((cell, idx) => {
              const cellBookings = bookings.filter(b => b.date === cell.dateStr);
              const isToday = cell.dateStr === todayStr;
              const isSelected = cell.dateStr === selectedDateStr;

              // For today: sort upcoming first
              let sortedBookings = [...cellBookings].sort((a, b) => a.start_time.localeCompare(b.start_time));
              if (cell.dateStr === todayStr) {
                const upcoming = sortedBookings.filter(b => !checkIsPast(b.date, b.end_time));
                const past = sortedBookings.filter(b => checkIsPast(b.date, b.end_time));
                sortedBookings = [...upcoming, ...past];
              }

              const hasMore = sortedBookings.length > 3;
              const itemsToShow = hasMore ? sortedBookings.slice(0, 3) : sortedBookings;

              return (
                <div
                  key={idx}
                  className={`calendar-day-cell${!cell.currentMonth ? ' other-month' : ''}${isSelected ? ' selected' : ''}${isToday ? ' today' : ''}`}
                  style={{ cursor: 'pointer', overflow: 'hidden', padding: '3px', display: 'flex', flexDirection: 'column', textAlign: 'left' }}
                  onClick={() => setSelectedDateStr(cell.dateStr)}
                >
                  <span className="day-number">{cell.day}</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '2px', width: '100%', boxSizing: 'border-box' }}>
                    {itemsToShow.map(b => {
                      const isPast = checkIsPast(b.date, b.end_time);
                      const isDone = b.status === 'done';
                      const isRescheduled = b.status === 'rescheduled';
                      const greenish = isPast || isDone;
                      const yellowish = isRescheduled && !isDone;
                      const blockColor = greenish ? '#10b981' : yellowish ? '#f59e0b' : (b.color || 'var(--primary)');
                      const blockBg = greenish ? 'rgba(16,185,129,0.12)' : yellowish ? 'rgba(245,158,11,0.12)' : (b.color || 'var(--primary)').replace(')', ', 0.15)');
                      const textColor = greenish ? '#34d399' : yellowish ? '#fbbf24' : 'var(--text-primary)';
                      return (
                        <div
                          key={b.id}
                          style={{ borderLeft: `3px solid ${blockColor}`, background: blockBg, padding: '2px 4px', borderRadius: '2px', fontSize: '0.65rem', width: '100%', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}
                          title={`${b.class_name} (${b.student_name})`}
                        >
                          <span style={{ fontSize: '0.6rem', fontWeight: '600', color: textColor, whiteSpace: 'nowrap' }}>
                            {b.start_time}-{b.end_time}
                          </span>
                        </div>
                      );
                    })}
                    {hasMore && (
                      <div
                        style={{ fontSize: '0.58rem', color: 'var(--primary)', fontWeight: '600', cursor: 'pointer', padding: '1px 4px', borderRadius: '2px', background: 'rgba(139,92,246,0.1)', textAlign: 'center' }}
                        onClick={(e) => { e.stopPropagation(); setModalDateStr(cell.dateStr); setShowDayEventsModal(true); }}
                      >
                        +{sortedBookings.length - 3} เพิ่มเติม
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Right: Form + Agenda ── */}
      <div style={{ flex: '0 0 calc(35% - 8px)', width: 'calc(35% - 8px)', display: 'flex', flexDirection: 'column', gap: '12px', overflow: 'hidden', minWidth: 0 }}>

        {/* Booking Form Card */}
        <div className="glass-card" style={{ flexShrink: 0, padding: '14px', overflow: 'visible' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <CalendarIcon size={16} style={{ color: 'var(--primary)' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              {selectedDateStr ? `วันที่ ${formatTimetableDate(selectedDateStr)}` : 'เลือกวันที่บนปฏิทิน'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
            {/* Category */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <label style={{ fontSize: '0.65rem', fontWeight: '600', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>CATEGORY</label>
              <CustomSelect
                value={className}
                onChange={val => { setClassName(val); setStudentName(''); }}
                options={dynamicCategories.map(c => ({ value: c, label: c }))}
                onEditOption={async (opt) => {
                  const newName = window.prompt(`แก้ไขชื่อหมวดหมู่ "${opt.label}" เป็น:`, opt.label);
                  if (newName && newName.trim()) {
                    const existingCatObj = Array.isArray(categories) 
                      ? categories.find(c => (c.name || c) === opt.label) 
                      : null;
                    const currentCalName = existingCatObj ? (existingCatObj.google_calendar_name || '') : '';
                    const googleCalendarName = window.prompt(
                      `ป้อนชื่อปฏิทิน Google Calendar ที่ต้องการซิงค์แยกสำหรับหมวดหมู่ "${newName.trim()}"\n(ปล่อยว่างหากต้องการใช้ปฏิทินหลัก):`,
                      currentCalName
                    );
                    if (googleCalendarName === null) return; // cancelled

                    try {
                      const res = await apiFetch(`/api/categories/${encodeURIComponent(opt.value)}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                          newName: newName.trim(),
                          google_calendar_name: googleCalendarName.trim()
                        })
                      });
                      if (res.ok) {
                        if (onStudentsChanged) await onStudentsChanged();
                        if (onBookingCreated) await onBookingCreated();
                        if (onCategoriesChanged) await onCategoriesChanged();
                        setClassName(newName.trim());
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
                        if (onBookingCreated) await onBookingCreated();
                        if (onCategoriesChanged) await onCategoriesChanged();
                        setClassName('งานสอน');
                        setStudentName('');
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

            {/* Student Name */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <label style={{ fontSize: '0.65rem', fontWeight: '600', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>{getStudentLabel(className)}</label>
              <div style={{ display: 'flex', gap: '4px' }}>
                <CustomSelect
                  value={studentName}
                  onChange={handleStudentSelect}
                  placeholder={getStudentPlaceholder(className)}
                  options={students
                    .filter(s => (s.category || 'งานสอน') === className)
                    .map(s => ({ value: s.name, label: s.name, id: s.id }))
                  }
                  onEditOption={async (opt) => {
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
                          if (studentName === opt.value) {
                            setStudentName(newName.trim());
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
                    if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบรายชื่อ "${opt.label}"?`)) {
                      try {
                        const res = await apiFetch(`/api/students/${opt.id}`, { method: 'DELETE' });
                        if (res.ok) {
                          if (onStudentsChanged) await onStudentsChanged();
                          if (studentName === opt.value) {
                            setStudentName('');
                          }
                        } else {
                          alert('ไม่สามารถลบรายชื่อได้');
                        }
                      } catch (err) {
                        console.error(err);
                      }
                    }
                  }}
                  style={{ flex: 1 }}
                />
                <button type="button" onClick={() => setShowAddStudentModal(true)} style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', color: 'var(--primary)', borderRadius: '10px', padding: '0 10px', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold', flexShrink: 0 }} title="เพิ่มรายชื่อใหม่">+</button>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
            {/* Start Time */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <label style={{ fontSize: '0.65rem', fontWeight: '600', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>START TIME</label>
              <CustomSelect
                value={startTime}
                onChange={val => setStartTime(val)}
                options={START_TIME_OPTIONS.map(t => ({ value: t, label: t }))}
              />
            </div>

            {/* End Time */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <label style={{ fontSize: '0.65rem', fontWeight: '600', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>END TIME</label>
              <CustomSelect
                value={endTime}
                onChange={val => setEndTime(val)}
                options={END_TIME_OPTIONS.map(t => ({ value: t, label: t }))}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
            {/* Location */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <label style={{ fontSize: '0.65rem', fontWeight: '600', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>LOCATION</label>
              <input type="text" value={studentLocation} onChange={e => setStudentLocation(e.target.value)} placeholder="ที่อยู่/สถานที่" style={{ fontSize: '0.8rem' }} />
            </div>

            {/* Class Type */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <label style={{ fontSize: '0.65rem', fontWeight: '600', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>TYPE</label>
              <CustomSelect
                value={classType}
                onChange={val => setClassType(val)}
                options={CLASS_TYPES.map(t => ({ value: t, label: t }))}
              />
            </div>
          </div>

          {/* Notes + Save row */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <label style={{ fontSize: '0.65rem', fontWeight: '600', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>NOTES</label>
              <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="หมายเหตุ (ถ้ามี)" style={{ flex: 1, fontSize: '0.8rem' }} />
            </div>

            <button onClick={handleSave} disabled={loading} style={{ background: 'var(--gradient-cosmic)', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 14px', cursor: loading ? 'wait' : 'pointer', fontSize: '0.8rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
              <Save size={14} />
              {loading ? 'Saving...' : 'Save & Sync'}
            </button>
          </div>
        </div>

        {/* Today's Agenda */}
        <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', flexShrink: 0 }}>
            <Clock size={14} style={{ color: 'var(--primary)' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              TODAY'S SCHEDULE ({formatTimetableDate(todayStr)})
            </span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', paddingRight: '2px' }}>
            {bookings.filter(b => b.date === todayStr).length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', border: '1.5px dashed var(--glass-border)', borderRadius: '6px' }}>
                <Clock size={18} style={{ opacity: 0.5, marginBottom: '6px' }} />
                <span>ไม่มีตารางงานนัดหมายในวันนี้</span>
              </div>
            ) : (
              bookings
                .filter(b => b.date === todayStr)
                .sort((a, b) => {
                  // Upcoming first for today
                  const aPast = checkIsPast(a.date, a.end_time);
                  const bPast = checkIsPast(b.date, b.end_time);
                  if (aPast !== bPast) return aPast ? 1 : -1;
                  return a.start_time.localeCompare(b.start_time);
                })
                .map(b => <AgendaBookingCard key={b.id} b={b} onStatusUpdate={updateBookingStatus} onDelete={handleDeleteBooking} onRefresh={onBookingCreated} />)
            )}
          </div>
        </div>
      </div>

      {/* ── Floating Toast ── */}
      {(successMsg || errorMsg) && (
        <div style={{ position: 'fixed', top: '80px', right: '20px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '8px', pointerEvents: 'none' }}>
          {successMsg && (
            <div style={{ background: 'linear-gradient(135deg, #065f46, #047857)', color: '#fff', padding: '10px 16px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: '600', boxShadow: '0 4px 20px rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', gap: '8px', maxWidth: '320px' }}>
              <Sparkles size={14} /> {successMsg}
            </div>
          )}
          {errorMsg && (
            <div style={{ background: 'linear-gradient(135deg, #eab308, #ca8a04)', color: '#1e293b', padding: '10px 16px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: '700', boxShadow: '0 4px 20px rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', gap: '8px', maxWidth: '320px', pointerEvents: 'all' }}>
              <AlertCircle size={14} style={{ color: '#1e293b' }} /> {errorMsg}
              <button onClick={() => setErrorMsg('')} style={{ background: 'none', border: 'none', color: '#1e293b', cursor: 'pointer', marginLeft: '4px', opacity: 0.7 }}>✕</button>
            </div>
          )}
        </div>
      )}

      {/* ── Day Events Modal ── */}
      {showDayEventsModal && (
        <div className="modal-overlay" onClick={() => setShowDayEventsModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', width: '100%', maxWidth: '480px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexShrink: 0 }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#1e293b' }}>
                ตารางงานทั้งหมด ({formatTimetableDate(modalDateStr)})
              </h3>
              <button onClick={() => setShowDayEventsModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#64748b', lineHeight: 1 }}>&times;</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', paddingRight: '4px', flex: 1 }}>
              {bookings
                .filter(b => b.date === modalDateStr)
                .sort((a, b) => a.start_time.localeCompare(b.start_time))
                .map(b => (
                  <AgendaBookingCard
                    key={b.id}
                    b={b}
                    onStatusUpdate={updateBookingStatus}
                    onDelete={(booking) => handleDeleteBooking(booking, () => {
                      const remaining = bookings.filter(r => r.date === modalDateStr && r.id !== booking.id);
                      if (remaining.length === 0) setShowDayEventsModal(false);
                    })}
                    onRefresh={onBookingCreated}
                    large
                  />
                ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #cbd5e1', flexShrink: 0 }}>
              <button onClick={() => setShowDayEventsModal(false)} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#475569', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontSize: '0.85rem' }}>ปิดหน้าต่าง</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Student Modal ── */}
      {showAddStudentModal && (
        <div className="modal-overlay" onClick={() => setShowAddStudentModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '440px', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15), 0 10px 10px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '16px', fontFamily: 'inherit' }}>
              เพิ่มรายชื่อใหม่
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Step 1: Category Selection / Management */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.72rem', fontWeight: '700', color: '#475569', letterSpacing: '0.05em' }}>CATEGORY</label>
                
                {!isAddingCustomCategory ? (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <CustomSelect
                      value={modalCategory}
                      onChange={(val) => {
                        if (val === '__ADD_NEW__') {
                          setIsAddingCustomCategory(true);
                        } else {
                          setModalCategory(val);
                        }
                      }}
                      options={[
                        ...dynamicCategories.map(c => ({ value: c, label: c })),
                        { value: '__ADD_NEW__', label: '+ เพิ่มหมวดหมู่ใหม่...' }
                      ]}
                      style={{ flex: 1 }}
                    />
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="text"
                      value={customCategoryInput}
                      onChange={(e) => setCustomCategoryInput(e.target.value)}
                      placeholder="ป้อนชื่อหมวดหมู่ใหม่..."
                      style={{
                        flex: 1,
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: '1px solid #cbd5e1',
                        background: '#ffffff',
                        color: '#0f172a',
                        fontSize: '0.85rem',
                        outline: 'none',
                        fontFamily: 'inherit',
                      }}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingCustomCategory(false);
                        setCustomCategoryInput('');
                      }}
                      style={{
                        background: '#f1f5f9',
                        border: '1px solid #cbd5e1',
                        color: '#475569',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                      }}
                    >
                      ยกเลิก
                    </button>
                  </div>
                )}
              </div>

              {/* Step 2: Student Name */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.72rem', fontWeight: '700', color: '#475569', letterSpacing: '0.05em' }}>NAME / TOPIC</label>
                <input
                  type="text"
                  value={newStudentInputValue}
                  onChange={e => setNewStudentInputValue(e.target.value)}
                  placeholder="ป้อนชื่อผู้เรียน หรือหัวข้อใหม่..."
                  style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#0f172a',
                    fontSize: '0.85rem',
                    outline: 'none',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              {/* Step 3: Color Select */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.72rem', fontWeight: '700', color: '#475569', letterSpacing: '0.05em' }}>SELECT COLOR (32 PASTEL COLORS)</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '10px', padding: '6px 0' }}>
                  {PASTEL_COLORS.map(c => (
                    <div
                      key={c}
                      onClick={() => setNewStudentColor(c)}
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: c,
                        cursor: 'pointer',
                        border: newStudentColor === c ? '3px solid #1e293b' : '1px solid #e2e8f0',
                        boxShadow: newStudentColor === c ? '0 0 6px rgba(30,41,59,0.4)' : 'none',
                        transition: 'transform 0.15s, border-color 0.15s',
                        justifySelf: 'center',
                      }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
              <button
                onClick={() => {
                  setShowAddStudentModal(false);
                  setNewStudentInputValue('');
                  setCustomCategoryInput('');
                  setIsAddingCustomCategory(false);
                }}
                style={{
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  color: '#475569',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: '600'
                }}
              >
                ยกเลิก
              </button>
              <button
                onClick={handleAddNewStudent}
                style={{
                  background: '#10b981',
                  border: 'none',
                  color: '#fff',
                  borderRadius: '8px',
                  padding: '8px 18px',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: '700'
                }}
              >
                บันทึก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Agenda Booking Card (shared between list and modal) ──────────────────────
function AgendaBookingCard({ b, onStatusUpdate, onDelete, onRefresh, large = false }) {
  const isPast = checkIsPast(b.date, b.end_time);
  const isDone = b.status === 'done';
  const isRescheduled = b.status === 'rescheduled';
  const isCancelled = b.status === 'cancelled';
  const { borderColor, bg, textColor, subTextColor, tagBg } = getStatusColors(b);

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: bg, padding: large ? '12px 16px' : '8px 12px', borderRadius: '6px', border: '1px solid var(--glass-border)', borderLeft: `4px solid ${borderColor}`, transition: 'background 0.2s ease' }}>

      {/* Left: Info */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', overflow: 'hidden', flex: 1 }}>
        {/* Name + tags row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: large ? '0.9rem' : '0.82rem', fontWeight: '700', color: textColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {b.student_name}
          </span>
          <span style={{ fontSize: '0.65rem', background: tagBg, color: textColor, padding: '1px 5px', borderRadius: '4px', fontWeight: '600' }}>
            {b.class_name}
          </span>
          <span style={{ fontSize: '0.65rem', background: isRescheduled && !isDone ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.06)', padding: '1px 5px', borderRadius: '4px', color: isRescheduled && !isDone ? '#fbbf24' : 'var(--text-muted)' }}>
            {b.class_type}
          </span>
          {/* Status badges */}
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

        {/* Time + location */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.72rem', color: subTextColor, flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <Clock size={11} /> {b.start_time} – {b.end_time}
          </span>
          {b.location && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '3px', maxWidth: '180px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }} title={b.location}>
              📍 {b.location}
            </span>
          )}
        </div>

        {/* Notes */}
        {b.notes && (
          <span style={{ fontSize: '0.7rem', color: subTextColor, fontStyle: 'italic', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }} title={b.notes}>
            Note: {b.notes}
          </span>
        )}

        {/* ── Action buttons for past events ── */}
        {isPast && (
          <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
            {/* งานเสร็จ / แก้ไข toggle */}
            {!isDone ? (
              <button
                type="button"
                onClick={() => onStatusUpdate(b, 'done')}
                style={{ background: '#047857', color: '#fff', border: 'none', padding: '3px 10px', borderRadius: '4px', fontSize: '0.73rem', fontWeight: '600', cursor: 'pointer' }}
              >
                งานเสร็จ
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onStatusUpdate(b, 'scheduled')}
                style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)', padding: '3px 10px', borderRadius: '4px', fontSize: '0.73rem', fontWeight: '600', cursor: 'pointer' }}
              >
                ↩ แก้ไข
              </button>
            )}

            {/* เลื่อนนัด — yellow, does NOT delete, just sets status */}
            {!isRescheduled ? (
              <button
                type="button"
                onClick={() => onStatusUpdate(b, 'rescheduled')}
                style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.35)', padding: '3px 10px', borderRadius: '4px', fontSize: '0.73rem', fontWeight: '600', cursor: 'pointer' }}
              >
                เลื่อนนัด
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onStatusUpdate(b, 'scheduled')}
                style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.25)', padding: '3px 10px', borderRadius: '4px', fontSize: '0.73rem', fontWeight: '600', cursor: 'pointer' }}
              >
                ↩ ยกเลิกเลื่อน
              </button>
            )}

            {/* ยกเลิกนัด — red, sets status='cancelled', does NOT delete */}
            {!isCancelled ? (
              <button
                type="button"
                onClick={() => onStatusUpdate(b, 'cancelled')}
                style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)', padding: '3px 10px', borderRadius: '4px', fontSize: '0.73rem', fontWeight: '600', cursor: 'pointer' }}
              >
                ยกเลิกนัด
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onStatusUpdate(b, 'scheduled')}
                style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', padding: '3px 10px', borderRadius: '4px', fontSize: '0.73rem', fontWeight: '600', cursor: 'pointer' }}
              >
                ↩ ยกเลิกการยกเลิก
              </button>
            )}
          </div>
        )}
      </div>

      {/* Right: Trash (always visible) */}
      <button
        type="button"
        onClick={() => {
          if (window.confirm(`ลบตารางงาน "${b.class_name} – ${b.student_name}" ใช่หรือไม่?`)) {
            onDelete(b);
          }
        }}
        style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', opacity: 0.65, marginLeft: '8px', flexShrink: 0 }}
        title="ลบงาน"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}
