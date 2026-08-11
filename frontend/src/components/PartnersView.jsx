import React, { useState, useEffect } from 'react';
import { UserPlus, Users, Trash2, Mail, ShieldAlert, CheckCircle, Loader2 } from 'lucide-react';
import { apiFetch } from '../api';

export default function PartnersView() {
  const [partners, setPartners] = useState([]);
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [alert, setAlert] = useState(null); // { type: 'success'|'error', message: string }

  // Fetch partners list on mount
  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      setListLoading(true);
      const res = await apiFetch('/api/partners');
      if (res.ok) {
        const data = await res.json();
        setPartners(data);
      } else {
        const err = await res.json();
        console.error('Error fetching partners:', err);
      }
    } catch (err) {
      console.error('Error fetching partners:', err);
    } finally {
      setListLoading(false);
    }
  };

  const handleAddPartner = async (e) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    setLoading(true);
    setAlert(null);

    try {
      const res = await apiFetch('/api/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail.trim() })
      });

      if (res.ok) {
        setAlert({ type: 'success', message: `เชื่อมต่อพาร์ทเนอร์ "${newEmail.trim()}" สำเร็จ!` });
        setNewEmail('');
        await fetchPartners();
      } else {
        const err = await res.json();
        setAlert({ type: 'error', message: err.error || 'ไม่สามารถเพิ่มพาร์ทเนอร์ได้' });
      }
    } catch (err) {
      setAlert({ type: 'error', message: 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์' });
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePartner = async (email) => {
    if (!window.confirm(`⚠️ คุณแน่ใจหรือไม่ที่จะยกเลิกการแชร์ตารางร่วมกับ "${email}"?\n(การยกเลิกจะทำให้ข้อมูลตารางของทั้งสองฝ่ายแยกกันทันที)`)) {
      return;
    }

    try {
      const res = await apiFetch(`/api/partners/${encodeURIComponent(email)}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setAlert({ type: 'success', message: 'ยกเลิกการแชร์ข้อมูลเรียบร้อยแล้ว' });
        await fetchPartners();
      } else {
        const err = await res.json();
        setAlert({ type: 'error', message: err.error || 'ไม่สามารถลบพาร์ทเนอร์ได้' });
      }
    } catch (err) {
      setAlert({ type: 'error', message: 'เกิดข้อผิดพลาดในการลบพาร์ทเนอร์' });
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto', boxSizing: 'border-box' }}>
      {/* Title Header */}
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)'
        }}>
          <Users size={22} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', margin: 0, color: '#0f172a' }}>
            ทีม & พาร์ทเนอร์ (Partners)
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '4px 0 0 0' }}>
            แชร์ตารางสอน รายชื่อนักเรียน และหมวดหมู่ชีวิตคู่/งาน ร่วมกันระหว่าง 2 บัญชีแบบเรียลไทม์
          </p>
        </div>
      </div>

      {/* Alert Notifications */}
      {alert && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '12px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.85rem',
          fontWeight: '600',
          background: alert.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          color: alert.type === 'success' ? '#059669' : '#dc2626',
          border: alert.type === 'success' ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          {alert.type === 'success' ? <CheckCircle size={16} /> : <ShieldAlert size={16} />}
          <span>{alert.message}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px', alignItems: 'start' }}>
        
        {/* Add Partner Form */}
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
        }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '700', margin: '0 0 8px 0', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserPlus size={18} style={{ color: '#4f46e5' }} />
            เชื่อมต่อพาร์ทเนอร์คนใหม่
          </h2>
          <p style={{ fontSize: '0.8', color: '#64748b', margin: '0 0 16px 0', lineHeight: '1.4' }}>
            พิมพ์กรอกอีเมล Google ของแฟนคุณหรือผู้ร่วมทีม เพื่อเชิญและเปิดสิทธิ์แชร์ข้อมูลตารางทั้งหมดร่วมกัน
          </p>

          <form onSubmit={handleAddPartner} style={{ display: 'flex', gap: '10px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="email"
                placeholder="กรอกอีเมล เช่น partner@gmail.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 38px',
                  boxSizing: 'border-box',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.85rem',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  background: '#f8fafc'
                }}
                onFocus={(e) => e.target.style.borderColor = '#4f46e5'}
                onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !newEmail.trim()}
              style={{
                padding: '12px 20px',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                color: '#ffffff',
                fontWeight: '700',
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'opacity 0.2s',
                opacity: (loading || !newEmail.trim()) ? 0.6 : 1
              }}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
              เชื่อมต่อ
            </button>
          </form>
        </div>

        {/* Partners List */}
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
        }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '700', margin: '0 0 16px 0', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={18} style={{ color: '#4f46e5' }} />
            พาร์ทเนอร์ปัจจุบัน ({partners.length})
          </h2>

          {listLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '30px 0', color: '#64748b' }}>
              <Loader2 size={24} className="animate-spin" />
            </div>
          ) : partners.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: '#94a3b8',
              border: '2px dashed #e2e8f0',
              borderRadius: '12px',
              fontSize: '0.85rem'
            }}>
              <Users size={32} style={{ margin: '0 auto 12px auto', color: '#cbd5e1' }} />
              ยังไม่มีพาร์ทเนอร์หรือทีมงานเชื่อมต่ออยู่
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {partners.map((email) => (
                <div 
                  key={email}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 16px',
                    borderRadius: '12px',
                    border: '1px solid #f1f5f9',
                    background: '#f8fafc',
                    transition: 'box-shadow 0.2s, background-color 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: 'rgba(79, 70, 229, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#4f46e5',
                      fontWeight: '700',
                      fontSize: '0.9rem'
                    }}>
                      {email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#0f172a' }}>{email}</span>
                      <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '2px', fontWeight: '500' }}>
                        ● แชร์ข้อมูลตารางเรียน & นักเรียนอยู่
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleRemovePartner(email)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      padding: '8px',
                      borderRadius: '8px',
                      transition: 'color 0.2s, background-color 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#ef4444';
                      e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#94a3b8';
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
