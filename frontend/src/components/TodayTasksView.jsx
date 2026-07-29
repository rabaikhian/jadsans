import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Clock, BookOpen, Users, Shield, UserCheck, MapPin, ClipboardList, ChevronLeft, ChevronRight, Calendar, Trash2, CornerUpLeft, X, ChevronDown, Palette } from 'lucide-react';
import { apiFetch } from '../api';


const PASTEL_COLORS = [
  '#ffb3c6', '#ffc6ff', '#ffd1dc', '#ffcdd2', '#ffe5d9', '#ffdac1', '#ffd8be', '#ffe0b2',
  '#fff9db', '#fff5cc', '#fff9c4', '#f0f4c3', '#d8f3dc', '#d1fae5', '#c8e6c9', '#e8f5e9',
  '#e0f7fa', '#e0f2f1', '#b2dfdb', '#c7f9cc', '#e3f2fd', '#bbdefb', '#d0ebff', '#b3e5fc',
  '#ebd9fc', '#f3e8ff', '#e8def8', '#d1c4e9', '#f8bbd0', '#e1bee7', '#f0f4f8', '#e2e8f0'
];
// Reserved 30 distinct pastel hues for category colors customization (0-360)
const CATEGORY_HUES = [
  260, 217, 35, 142, 350, // default key hues first
  0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 
  150, 165, 180, 195, 210, 225, 240, 255, 270, 285, 
  300, 315, 330, 340, 355
];
// Generates start time options from 09:00 to 20:00
const START_TIME_OPTIONS = [];
for (let h = 9; h <= 20; h++) {
  const hh = h.toString().padStart(2, '0');
  START_TIME_OPTIONS.push(`${hh}:00`);
  if (h < 20) {
    START_TIME_OPTIONS.push(`${hh}:30`);
  }
}

// Generates end time options from 09:00 to 24:00
const END_TIME_OPTIONS = [];
for (let h = 9; h <= 24; h++) {
  const hh = h.toString().padStart(2, '0');
  END_TIME_OPTIONS.push(`${hh}:00`);
  if (h < 24) {
    END_TIME_OPTIONS.push(`${hh}:30`);
  }
}

const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const parts = timeStr.split(':');
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  return hours * 60 + minutes;
};

// --- Local Custom Select Component for Modal ---
function CustomSelect({ value, onChange, options, placeholder, style = {} }) {
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
                onClick={() => {
                  onChange(optValue);
                  setIsOpen(false);
                }}
                style={{
                  borderRadius: '8px',
                  padding: '8px 12px',
                  background: isSelected ? 'rgba(16,185,129,0.15)' : 'transparent',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  color: isSelected ? '#047857' : '#1e293b',
                  fontWeight: isSelected ? '600' : 'normal',
                  textAlign: 'left',
                  transition: 'background-color 0.15s',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.08)';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                {optLabel}
              </div>
            );
          })}
        </div>,
        document.body
      )}
    </div>
  );
}

const getCategoryIcon = (cat) => {
  switch (cat) {
    case 'งานสอน': return <BookOpen size={16} style={{ color: '#8b5cf6' }} />;
    case 'งานประชุม': return <Users size={16} style={{ color: '#3b82f6' }} />;
    case 'งานประกัน': return <Shield size={16} style={{ color: '#f59e0b' }} />;
    case 'งานนัดลูกค้า': return <UserCheck size={16} style={{ color: '#10b981' }} />;
    default: return <ClipboardList size={16} style={{ color: '#8b5cf6' }} />;
  }
};

const getCategoryHeaderStyle = (cat) => {
  switch (cat) {
    case 'งานสอน': return { borderTop: '4px solid #8b5cf6', background: 'rgba(139,92,246,0.06)' };
    case 'งานประชุม': return { borderTop: '4px solid #3b82f6', background: 'rgba(59,130,246,0.06)' };
    case 'งานประกัน': return { borderTop: '4px solid #f59e0b', background: 'rgba(245,158,11,0.06)' };
    case 'งานนัดลูกค้า': return { borderTop: '4px solid #10b981', background: 'rgba(16,185,129,0.06)' };
    default: return { borderTop: '4px solid #8b5cf6', background: 'rgba(139,92,246,0.06)' };
  }
};

export default function TodayTasksView({ bookings = [], students = [], categories = [], onBookingCreated, onCategoriesChanged }) {
  const getDynamicCategories = () => {
    const defaults = Array.isArray(categories) && categories.length > 0 ? categories : ['งานสอน', 'งานประชุม', 'งานประกัน', 'งานนัดลูกค้า'];
    const bookingCats = bookings.map(b => b.class_name).filter(Boolean);
    return Array.from(new Set([...defaults, ...bookingCats]));
  };
  const dynamicCategories = getDynamicCategories();
  const CATEGORIES = dynamicCategories;

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [expandedBookingId, setExpandedBookingId] = useState(null);
  const [showColorSettings, setShowColorSettings] = useState(false);

  // Category Color Map State (Persisted in localStorage)
  const [categoryColors, setCategoryColors] = useState(() => {
    const saved = localStorage.getItem('scheduler_category_colors');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return {};
  });

  const getCategoryDefaultHue = (cat) => {
    if (cat === 'งานสอน') return 260; // Purple
    if (cat === 'งานประชุม') return 217; // Blue
    if (cat === 'งานประกัน') return 35; // Orange/Yellow
    if (cat === 'งานนัดลูกค้า') return 142; // Green
    // Hash
    let hash = 0;
    for (let i = 0; i < cat.length; i++) {
      hash = cat.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash) % 360;
  };

  const updateCategoryColor = (cat, hue) => {
    const updated = { ...categoryColors, [cat]: hue };
    setCategoryColors(updated);
    localStorage.setItem('scheduler_category_colors', JSON.stringify(updated));
  };

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  
  // Edit Form Fields State
  const [editStudentName, setEditStudentName] = useState('');
  const [editCategory, setEditCategory] = useState('งานสอน');
  const [editDate, setEditDate] = useState('');
  const [editStartTime, setEditStartTime] = useState('09:00');
  const [editEndTime, setEditEndTime] = useState('10:00');
  const [editLocation, setEditLocation] = useState('');
  const [editClassType, setEditClassType] = useState('Onsite');
  const [editNotes, setEditNotes] = useState('');
  const [editColor, setEditColor] = useState(PASTEL_COLORS[0]);

  // Format YYYY-MM-DD for matching bookings
  const selectedDateStr = selectedDate.toISOString().split('T')[0];
  const targetBookings = bookings.filter(b => b.date === selectedDateStr);

  const changeDate = (days) => {
    const nextDate = new Date(selectedDate);
    nextDate.setDate(nextDate.getDate() + days);
    setSelectedDate(nextDate);
    setExpandedBookingId(null); // Reset expansion on date change
  };

  const resetToToday = () => {
    setSelectedDate(new Date());
    setExpandedBookingId(null);
  };

  const formatThaiDate = (date) => {
    const day = date.getDate();
    const monthIndex = date.getMonth();
    const year = date.getFullYear() + 543;
    const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const days = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
    const dayName = days[date.getDay()];
    return `วัน${dayName}ที่ ${day} ${months[monthIndex]} ${year}`;
  };

  const formatThaiDateSimple = (date) => {
    const day = date.getDate();
    const monthIndex = date.getMonth();
    const year = date.getFullYear() + 543;
    const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    return `${day} ${months[monthIndex]} ${year}`;
  };

  // --- API Action Handlers ---
  const handleUpdateStatus = async (booking, newStatus) => {
    try {
      const res = await apiFetch(`/api/bookings/${booking.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...booking,
          status: newStatus
        })
      });
      if (res.ok) {
        if (onBookingCreated) await onBookingCreated();
      } else {
        const errData = await res.json();
        alert(errData.error || 'ไม่สามารถอัปเดตสถานะได้');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateColor = async (booking, newColor) => {
    try {
      const res = await apiFetch(`/api/bookings/${booking.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...booking,
          color: newColor
        })
      });
      if (res.ok) {
        if (onBookingCreated) await onBookingCreated();
      } else {
        const errData = await res.json();
        alert(errData.error || 'ไม่สามารถอัปเดตสีได้');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteBooking = async (id) => {
    if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบการนัดหมายนี้?')) {
      try {
        const res = await apiFetch(`/api/bookings/${id}`, { method: 'DELETE' });
        if (res.ok) {
          if (onBookingCreated) await onBookingCreated();
        } else {
          alert('ไม่สามารถลบการนัดหมายได้');
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleOpenEdit = (booking) => {
    setEditingBooking(booking);
    setEditStudentName(booking.student_name);
    setEditCategory(booking.class_name);
    setEditDate(booking.date);
    setEditStartTime(booking.start_time);
    setEditEndTime(booking.end_time);
    setEditLocation(booking.location || '');
    setEditClassType(booking.class_type || 'Onsite');
    setEditNotes(booking.notes || '');
    setEditColor(booking.color || PASTEL_COLORS[0]);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editStudentName || !editDate || !editStartTime || !editEndTime) {
      alert('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน');
      return;
    }

    try {
      const res = await apiFetch(`/api/bookings/${editingBooking.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          class_name: editCategory,
          student_name: editStudentName,
          date: editDate,
          start_time: editStartTime,
          end_time: editEndTime,
          notes: editNotes,
          color: editColor,
          location: editLocation,
          class_type: editClassType,
          status: editingBooking.status || 'scheduled'
        })
      });

      if (res.ok) {
        if (onBookingCreated) await onBookingCreated();
        setShowEditModal(false);
      } else {
        const errData = await res.json();
        alert(errData.error || 'ไม่สามารถแก้ไขข้อมูลนัดหมายได้');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Cycles booking status on badge click
  const cycleStatus = (booking) => {
    const statuses = ['scheduled', 'done', 'rescheduled', 'cancelled'];
    const currentIdx = statuses.indexOf(booking.status || 'scheduled');
    const nextIdx = (currentIdx + 1) % statuses.length;
    handleUpdateStatus(booking, statuses[nextIdx]);
  };

  // Helper to render booking status pill
  const renderStatusPill = (booking) => {
    const status = booking.status || 'scheduled';
    let label = 'รอเรียน';
    let style = { background: '#94a3b8', color: '#ffffff' };

    if (status === 'done') {
      label = '✓ เสร็จสิ้น';
      style = { background: '#047857', color: '#ffffff' };
    } else if (status === 'rescheduled') {
      label = 'เลื่อนนัด';
      style = { background: '#d97706', color: '#ffffff' };
    } else if (status === 'cancelled') {
      label = 'ยกเลิกนัด';
      style = { background: '#dc2626', color: '#ffffff' };
    }

    return (
      <div 
        onClick={(e) => {
          e.stopPropagation();
          cycleStatus(booking);
        }}
        style={{
          padding: '3px 10px',
          borderRadius: '6px',
          fontSize: '0.68rem',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
          cursor: 'pointer',
          userSelect: 'none',
          transition: 'all 0.15s',
          ...style
        }}
        title="คลิกเพื่อเปลี่ยนสถานะ"
        onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.1)'}
        onMouseLeave={e => e.currentTarget.style.filter = 'none'}
      >
        {label}
      </div>
    );
  };

  // Helper to get pastel post-it and tape colors based on category colors mapping
  const getPostItColors = (b) => {
    const category = b.class_name || 'งานสอน';
    const hue = categoryColors[category] || getCategoryDefaultHue(category);
    const bg = `hsl(${hue}, 80%, 91%)`;
    const tape = `hsl(${hue}, 85%, 65%)`;
    return { bg, tape };
  };

  // Helper to render colored sticky notes for categories (Right Column)
  const renderStickyNoteCard = (b, index) => {
    const isDone = b.status === 'done';
    const isRescheduled = b.status === 'rescheduled';
    const isCancelled = b.status === 'cancelled';
    const rotation = index % 2 === 0 ? '-0.8deg' : '0.8deg';
    const { bg, tape } = getPostItColors(b);

    return (
      <div
        key={b.id}
        style={{
          background: bg,
          padding: '12px 14px',
          borderRadius: '2px',
          boxShadow: '2px 4px 8px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)',
          position: 'relative',
          transform: `rotate(${rotation})`,
          transition: 'transform 0.2s, box-shadow 0.2s',
          cursor: 'default',
          borderBottomRightRadius: '14px 4px',
          opacity: isCancelled ? 0.7 : 1,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = `rotate(${rotation}) translateY(-2px) scale(1.01)`;
          e.currentTarget.style.boxShadow = '4px 8px 12px rgba(0,0,0,0.15)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = `rotate(${rotation})`;
          e.currentTarget.style.boxShadow = '2px 4px 8px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)';
        }}
      >
        {/* Tape effect at the top */}
        <div style={{
          position: 'absolute',
          top: '-8px',
          left: '50%',
          transform: 'translateX(-50%) rotate(-1.5deg)',
          width: '40px',
          height: '12px',
          background: tape,
          opacity: 0.65,
          boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
        }} />

        {/* Top row: time slot & status badges */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.68rem', color: '#4b5563', fontWeight: '600' }}>
              <Clock size={10} />
              <span>{b.start_time} - {b.end_time}</span>
            </div>
            <span style={{ 
              fontSize: '0.58rem', 
              padding: '1px 5px', 
              borderRadius: '4px', 
              background: 'rgba(0,0,0,0.06)', 
              color: '#374151', 
              fontWeight: '700' 
            }}>
              {b.class_name}
            </span>
          </div>

          {/* Status label badges */}
          <div onClick={() => cycleStatus(b)} style={{ cursor: 'pointer' }}>
            {isDone && (
              <span style={{ fontSize: '0.6rem', padding: '1px 5px', borderRadius: '4px', background: '#e6f4ea', color: '#137333', fontWeight: '700' }}>
                DONE
              </span>
            )}
            {isRescheduled && (
              <span style={{ fontSize: '0.6rem', padding: '1px 5px', borderRadius: '4px', background: '#fef7e0', color: '#b06000', fontWeight: '700' }}>
                DELAY
              </span>
            )}
            {isCancelled && (
              <span style={{ fontSize: '0.6rem', padding: '1px 5px', borderRadius: '4px', background: '#fce8e6', color: '#c5221f', fontWeight: '700' }}>
                CANCEL
              </span>
            )}
            {!isDone && !isRescheduled && !isCancelled && (
              <span style={{ fontSize: '0.6rem', padding: '1px 5px', borderRadius: '4px', background: '#e2e8f0', color: '#475569', fontWeight: '700' }}>
                TODO
              </span>
            )}
          </div>
        </div>

        {/* Booking Name */}
        <div style={{ 
          fontSize: '0.88rem', 
          fontWeight: '800', 
          color: '#1a1a1a', 
          marginBottom: '4px',
          textDecoration: isDone ? 'line-through' : 'none',
          opacity: isDone ? 0.6 : 1
        }}>
          {b.student_name}
        </div>

        {/* Location */}
        {b.location && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.72rem', color: '#4a4a4a', marginBottom: '4px' }}>
            <MapPin size={10} style={{ color: '#ef4444', flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.location}</span>
          </div>
        )}

        {/* Notes */}
        {b.notes && (
          <div style={{ 
            fontSize: '0.68rem', 
            color: '#666666', 
            borderTop: '1px dashed rgba(0,0,0,0.1)', 
            paddingTop: '4px',
            marginTop: '6px',
            fontStyle: 'italic'
          }}>
            {b.notes}
          </div>
        )}

        {/* Footer actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginTop: '10px', paddingTop: '6px', borderTop: '1px dashed rgba(0,0,0,0.06)' }}>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => handleOpenEdit(b)}
              style={{
                background: 'none',
                border: 'none',
                padding: '2px',
                cursor: 'pointer',
                color: '#4b5563',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="แก้ไข"
            >
              <CornerUpLeft size={12} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteBooking(b.id);
              }}
              style={{
                background: 'none',
                border: 'none',
                padding: '2px',
                cursor: 'pointer',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="ลบ"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Helper to render dynamic student cards (Left Column)
  const renderBookingCard = (b) => {
    const profileColor = b.color || '#10b981';
    const isExpanded = b.id === expandedBookingId;
    const isDone = b.status === 'done';
    
    return (
      <div
        key={b.id}
        onClick={() => setExpandedBookingId(isExpanded ? null : b.id)}
        style={{
          background: isDone ? '#e6fbf4' : '#ffffff',
          borderRadius: '8px',
          borderLeft: `5px solid ${isDone ? '#047857' : profileColor}`,
          padding: '14px 16px',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.02)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          position: 'relative',
          transition: 'transform 0.15s, box-shadow 0.15s',
          cursor: 'pointer',
          border: isDone ? '1px solid #a7f3d0' : 'none',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 12px -2px rgba(0,0,0,0.08), 0 2px 6px -1px rgba(0,0,0,0.04)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.02)';
        }}
      >
        {/* Top Row: Student, Category, ClassType, Status, Trash */}
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
          {/* Student Name */}
          <span style={{ fontSize: '1rem', fontWeight: '800', color: isDone ? '#047857' : profileColor }}>
            {b.student_name}
          </span>

          {/* Category tag */}
          <span style={{ 
            fontSize: '0.7rem', 
            background: isDone ? 'rgba(4,120,87,0.1)' : 'rgba(16,185,129,0.1)', 
            color: isDone ? '#047857' : '#059669', 
            padding: '2px 8px', 
            borderRadius: '4px', 
            fontWeight: '700' 
          }}>
            {b.class_name}
          </span>

          {/* Class Type tag */}
          <span style={{ 
            fontSize: '0.7rem', 
            background: 'rgba(100,116,139,0.08)', 
            color: '#64748b', 
            padding: '2px 8px', 
            borderRadius: '4px', 
            fontWeight: '600' 
          }}>
            {b.class_type || 'Onsite'}
          </span>

          {/* Status pill (only show if status is done/rescheduled/cancelled, or if it is expanded) */}
          {(b.status !== 'scheduled' || isExpanded) && renderStatusPill(b)}

          {/* Delete Icon */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteBooking(b.id);
            }}
            style={{
              background: 'none',
              border: 'none',
              padding: '4px',
              cursor: 'pointer',
              marginLeft: 'auto',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
            title="ลบนัดหมาย"
          >
            <Trash2 size={14} />
          </button>
        </div>

        {/* Middle Row: Clock & MapPin details */}
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '16px', color: 'var(--text-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: '600', color: isDone ? '#047857' : '#059669' }}>
            <Clock size={12} />
            <span>{b.start_time} - {b.end_time}</span>
          </div>

          {b.location && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.8rem', fontWeight: '600', color: isDone ? '#047857' : '#db2777' }}>
              <MapPin size={12} style={{ color: isDone ? '#047857' : '#ec4899' }} />
              <span>{b.location}</span>
            </div>
          )}
        </div>

        {/* Notes (if any) */}
        {b.notes && (
          <div style={{ 
            fontSize: '0.7rem', 
            color: '#64748b', 
            background: isDone ? 'rgba(4,120,87,0.03)' : '#f8fafc',
            borderLeft: '2px solid #cbd5e1',
            padding: '4px 8px',
            borderRadius: '2px',
            fontStyle: 'italic',
            marginTop: '2px'
          }}>
            {b.notes}
          </div>
        )}

        {/* Bottom Row: Actions Buttons (แก้ไข, เลื่อนนัด, ยกเลิกนัด) - Only when expanded! */}
        {isExpanded && (
          <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }} onClick={e => e.stopPropagation()}>
            <button
              onClick={() => handleUpdateStatus(b, isDone ? 'scheduled' : 'done')}
              style={{
                background: isDone ? '#047857' : '#e6fbf4',
                border: isDone ? 'none' : '1px solid #a7f3d0',
                color: isDone ? '#ffffff' : '#047857',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '0.75rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontFamily: 'inherit',
                transition: 'background-color 0.15s'
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = isDone ? '#035a43' : '#d1fae5'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = isDone ? '#047857' : '#e6fbf4'}
            >
              งานเสร็จ
            </button>

            <button
              onClick={() => handleOpenEdit(b)}
              style={{
                background: '#fffbeb',
                border: '1px solid #fde68a',
                color: '#b45309',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '0.75rem',
                fontWeight: '700',
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'background-color 0.15s'
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fef3c7'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = '#fffbeb'}
            >
              เลื่อนนัด
            </button>

            <button
              onClick={() => handleUpdateStatus(b, 'cancelled')}
              style={{
                background: '#fef2f2',
                border: '1px solid #fca5a5',
                color: '#b91c1c',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '0.75rem',
                fontWeight: '700',
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'background-color 0.15s'
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fee2e2'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = '#fef2f2'}
            >
              ยกเลิกนัด
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', padding: '0 16px 16px 16px', boxSizing: 'border-box' }}>
      
      {/* Title Header with Date Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexShrink: 0 }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
            What needs to be done today?
          </h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {formatThaiDate(selectedDate)} &bull; มีงานนัดหมายทั้งหมด {targetBookings.length} รายการ
          </span>
        </div>

        {/* Navigation Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            onClick={resetToToday} 
            style={{ 
              background: 'var(--glass-bg)', 
              border: '1px solid var(--glass-border)', 
              color: 'var(--text-primary)', 
              padding: '6px 12px', 
              borderRadius: '8px', 
              cursor: 'pointer',
              fontSize: '0.78rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'var(--transition-fast)'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--glass-bg)'}
          >
            <Calendar size={13} />
            Today
          </button>
          
          <div style={{ display: 'flex', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', overflow: 'hidden' }}>
            <button 
              onClick={() => changeDate(-1)} 
              style={{ 
                background: 'none', 
                border: 'none', 
                color: 'var(--text-primary)', 
                padding: '6px 10px', 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                borderRight: '1px solid var(--glass-border)'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
              title="Previous Day"
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              onClick={() => changeDate(1)} 
              style={{ 
                background: 'none', 
                border: 'none', 
                color: 'var(--text-primary)', 
                padding: '6px 10px', 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
              title="Next Day"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Grid Columns or Empty State */}
      {targetBookings.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, border: '1.5px dashed var(--glass-border)', borderRadius: '16px', color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '40px', background: 'var(--glass-bg)', backdropFilter: 'blur(16px)', boxSizing: 'border-box' }}>
          <Calendar size={48} style={{ opacity: 0.4, marginBottom: '16px', color: 'var(--primary-light)' }} />
          <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>ไม่มีตารางงานนัดหมายในวันนี้</span>
          <span style={{ fontSize: '0.78rem', opacity: 0.7, marginTop: '6px' }}>คุณสามารถเพิ่มตารางงานนัดหมายได้จากหน้า Booking View</span>
        </div>
      ) : (() => {
        // --- Calculate sorted list (upcoming first, then past) ---
        const sortedAllBookings = (() => {
          const sorted = [...targetBookings].sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));
          const todayStr = new Date().toISOString().split('T')[0];
          if (selectedDateStr !== todayStr) {
            return sorted;
          }
          const now = new Date();
          const currentMinutes = now.getHours() * 60 + now.getMinutes();
          const upcoming = sorted.filter(b => timeToMinutes(b.end_time) > currentMinutes);
          const past = sorted.filter(b => timeToMinutes(b.end_time) <= currentMinutes);
          return [...upcoming, ...past];
        })();

        const otherActiveCategories = CATEGORIES.filter(cat => 
          targetBookings.some(b => b.class_name === cat)
        );

        const teachingHeaderStyle = getCategoryHeaderStyle('งานสอน');

        return (
          <div 
            className="glass-card"
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              padding: '20px',
              borderTop: '4px solid var(--primary-light)',
              background: 'var(--glass-bg)',
              borderRadius: '16px',
              flex: 1,
              overflow: 'hidden',
              boxSizing: 'border-box',
              width: '100%',
              maxHeight: 'calc(100vh - 180px)'
            }}
          >
            {/* Board Header */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px', 
              padding: '10px 16px', 
              borderRadius: '10px', 
              background: 'rgba(139, 92, 246, 0.08)', 
              marginBottom: '8px',
              flexShrink: 0
            }}>
              <ClipboardList size={18} style={{ color: 'var(--primary)' }} />
              <span style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '0.02em' }}>
                บอร์ดโพสต์อิทวันนี้ (POST-IT BOARD) - {formatThaiDateSimple(selectedDate)}
              </span>
              
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* Category Color Settings Toggle Button */}
                <button
                  onClick={() => setShowColorSettings(!showColorSettings)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: showColorSettings ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255,255,255,0.06)',
                    border: '1px solid var(--glass-border)',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    color: showColorSettings ? 'var(--primary-light)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '0.72rem',
                    fontWeight: '700',
                    transition: 'all 0.2s'
                  }}
                  title="ตั้งค่าสีหมวดหมู่"
                >
                  <Palette size={12} />
                  <span>จัดการสีหมวดหมู่</span>
                  <ChevronDown 
                    size={12} 
                    style={{ 
                      transform: showColorSettings ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.2s'
                    }} 
                  />
                </button>

                <span style={{ 
                  fontSize: '0.75rem', 
                  background: 'rgba(255,255,255,0.08)', 
                  padding: '2px 8px', 
                  borderRadius: '10px', 
                  color: 'var(--text-muted)',
                  fontWeight: '600'
                }}>
                  {targetBookings.length} รายการ
                </span>
              </div>
            </div>

            {/* Category Color Manager Toolbar (Collapsible) */}
            {showColorSettings && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: '12px',
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.02)',
                borderBottom: '1px dashed var(--glass-border)',
                boxSizing: 'border-box',
                marginBottom: '12px',
                flexShrink: 0
              }}>
                {dynamicCategories.map(cat => {
                  const currentHue = categoryColors[cat] || getCategoryDefaultHue(cat);
                  return (
                    <div key={cat} style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '8px', 
                      background: 'rgba(255, 255, 255, 0.04)', 
                      padding: '10px 14px', 
                      borderRadius: '12px', 
                      border: '1px solid var(--glass-border)' 
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '0.8rem' }}>{cat}</span>
                        <div style={{ 
                          width: '14px', 
                          height: '14px', 
                          borderRadius: '4px', 
                          background: `hsl(${currentHue}, 80%, 75%)`, 
                          border: '1px solid rgba(255,255,255,0.2)' 
                        }} />
                      </div>
                      <div style={{ 
                        display: 'flex', 
                        flexWrap: 'wrap', 
                        gap: '4px', 
                        background: '#ffffff', 
                        border: '1px solid rgba(0, 0, 0, 0.08)',
                        padding: '6px', 
                        borderRadius: '8px' 
                      }}>
                        {CATEGORY_HUES.map((hue, idx) => {
                          const isActive = Math.abs(currentHue - hue) < 2;
                          const dotBg = `hsl(${hue}, 85%, 70%)`;
                          return (
                            <button
                              key={hue}
                              onClick={() => updateCategoryColor(cat, hue)}
                              style={{
                                width: '11px',
                                height: '11px',
                                borderRadius: '50%',
                                background: dotBg,
                                border: isActive ? '2px solid #0f172a' : 'none',
                                padding: 0,
                                cursor: 'pointer',
                                transform: isActive ? 'scale(1.2)' : 'none',
                                transition: 'all 0.1s',
                                flexShrink: 0
                              }}
                              title={`สีพาสเทลที่ ${idx + 1}`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Sticky Notes Grid Container */}
            <div style={{ 
              flex: 1, 
              overflowY: 'auto', 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
              gap: '24px 20px', 
              padding: '16px 8px 24px 8px',
              alignContent: 'start'
            }}>
              {[...targetBookings]
                .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time))
                .map((b, index) => renderStickyNoteCard(b, index))}
            </div>
          </div>
        );
      })()}

      {/* Edit Booking Dialog Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '440px', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '16px' }}>
              แก้ไขข้อมูลตารางนัดหมาย
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Category */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.7rem', fontWeight: '700', color: '#475569', letterSpacing: '0.05em' }}>CATEGORY</label>
                <CustomSelect
                  value={editCategory}
                  onChange={(val) => {
                    setEditCategory(val);
                    // Match default student if category changes
                    const catStudents = students.filter(s => s.category === val);
                    if (catStudents.length > 0) {
                      setEditStudentName(catStudents[0].name);
                      setEditColor(catStudents[0].color || PASTEL_COLORS[0]);
                    } else {
                      setEditStudentName('');
                    }
                  }}
                  options={dynamicCategories.map(c => ({ value: c, label: c }))}
                />
              </div>

              {/* Student Name */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.7rem', fontWeight: '700', color: '#475569', letterSpacing: '0.05em' }}>STUDENT NAME / TOPIC</label>
                <CustomSelect
                  value={editStudentName}
                  onChange={(val) => {
                    setEditStudentName(val);
                    const matchedStudent = students.find(s => s.name === val);
                    if (matchedStudent && matchedStudent.color) {
                      setEditColor(matchedStudent.color);
                    }
                  }}
                  options={students.filter(s => s.category === editCategory).map(s => ({ value: s.name, label: s.name }))}
                  placeholder="-- เลือกรายชื่อนักเรียน --"
                />
              </div>

              {/* Date */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.7rem', fontWeight: '700', color: '#475569', letterSpacing: '0.05em' }}>DATE</label>
                <input
                  type="date"
                  value={editDate}
                  onChange={e => setEditDate(e.target.value)}
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

              {/* Start & End Time */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.7rem', fontWeight: '700', color: '#475569', letterSpacing: '0.05em' }}>START TIME</label>
                  <CustomSelect
                    value={editStartTime}
                    onChange={val => setEditStartTime(val)}
                    options={START_TIME_OPTIONS.map(t => ({ value: t, label: t }))}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.7rem', fontWeight: '700', color: '#475569', letterSpacing: '0.05em' }}>END TIME</label>
                  <CustomSelect
                    value={editEndTime}
                    onChange={val => setEditEndTime(val)}
                    options={END_TIME_OPTIONS.map(t => ({ value: t, label: t }))}
                  />
                </div>
              </div>

              {/* Class Type & Location */}
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.7rem', fontWeight: '700', color: '#475569', letterSpacing: '0.05em' }}>TYPE</label>
                  <CustomSelect
                    value={editClassType}
                    onChange={val => setEditClassType(val)}
                    options={[{ value: 'Onsite', label: 'Onsite' }, { value: 'Online', label: 'Online' }]}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.7rem', fontWeight: '700', color: '#475569', letterSpacing: '0.05em' }}>LOCATION</label>
                  <input
                    type="text"
                    value={editLocation}
                    onChange={e => setEditLocation(e.target.value)}
                    placeholder="ป้อนสถานที่..."
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
              </div>

              {/* Notes */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.7rem', fontWeight: '700', color: '#475569', letterSpacing: '0.05em' }}>NOTES</label>
                <input
                  type="text"
                  value={editNotes}
                  onChange={e => setEditNotes(e.target.value)}
                  placeholder="หมายเหตุเพิ่มเติม..."
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
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
              <button
                onClick={() => setShowEditModal(false)}
                style={{
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  color: '#475569',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: '600',
                  fontFamily: 'inherit'
                }}
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSaveEdit}
                style={{
                  background: 'var(--gradient-emerald)',
                  border: 'none',
                  color: '#fff',
                  borderRadius: '8px',
                  padding: '8px 18px',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  fontFamily: 'inherit'
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
