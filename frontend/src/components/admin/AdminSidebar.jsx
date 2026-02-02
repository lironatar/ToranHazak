import React from 'react';
import { Plus, Edit2, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminSidebar = ({
    menuOpen,
    viewMode,
    setViewMode,
    requests,
    units,
    activeUnitId,
    setActiveUnitId,
    unitStats,
    profiles,
    activeProfileId,
    setActiveProfileId,
    loading,
    users,
    createUnit,
    handleEditUnit,
    handleEditProfile,
    createProfile
}) => {
    return (
        <div className={`sidebar ${menuOpen ? 'open' : ''}`} style={{
            width: '280px',
            background: 'var(--glass-bg)',
            borderLeft: '1px solid var(--glass-border)',
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            position: 'sticky',
            top: 0
        }}>

            <div>
                {/* Header */}
                <div style={{ padding: '24px', borderBottom: '1px solid var(--glass-border)', textAlign: 'center' }}>
                    <img src="/Logo-Bright.png" alt="Logo" className="theme-logo" style={{ width: '80px', marginBottom: '12px' }} />
                    <h1 style={{ fontSize: '1.5rem', color: 'var(--accent-color)', marginBottom: '4px' }}>תורן חזק</h1>
                    <p style={{ fontSize: '0.85rem', opacity: 0.6 }}>ממשק ניהול צבאי</p>
                </div>

                {/* Navigation Items */}
                <div style={{ padding: '16px' }}>
                    <div
                        onClick={() => setViewMode('content')}
                        style={{
                            padding: '12px', borderRadius: '8px', cursor: 'pointer', marginBottom: '8px',
                            background: viewMode === 'content' ? 'rgba(255,255,255,0.05)' : 'transparent',
                            border: viewMode === 'content' ? '1px solid var(--glass-border)' : '1px solid transparent',
                            fontWeight: viewMode === 'content' ? 'bold' : 'normal'
                        }}
                    >
                        <span style={{ marginRight: '8px' }}>📝</span> ניהול תוכן
                    </div>
                    <div
                        onClick={() => setViewMode('requests')}
                        style={{
                            padding: '12px', borderRadius: '8px', cursor: 'pointer', marginBottom: '8px',
                            background: viewMode === 'requests' ? 'rgba(255,255,255,0.05)' : 'transparent',
                            border: viewMode === 'requests' ? '1px solid var(--glass-border)' : '1px solid transparent',
                            fontWeight: viewMode === 'requests' ? 'bold' : 'normal',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                        }}
                    >
                        <div><span style={{ marginRight: '8px' }}>👋</span> בקשות הצטרפות</div>
                        {requests.length > 0 && (
                            <span style={{ background: 'red', color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '0.8rem' }}>{requests.length}</span>
                        )}
                    </div>
                    <div
                        onClick={() => setViewMode('users')}
                        style={{
                            padding: '12px', borderRadius: '8px', cursor: 'pointer', marginBottom: '8px',
                            background: viewMode === 'users' ? 'rgba(255,255,255,0.05)' : 'transparent',
                            border: viewMode === 'users' ? '1px solid var(--glass-border)' : '1px solid transparent',
                            fontWeight: viewMode === 'users' ? 'bold' : 'normal'
                        }}
                    >
                        <span style={{ marginRight: '8px' }}>👥</span> אנשים
                    </div>
                    <div
                        onClick={() => setViewMode('schedule')}
                        style={{
                            padding: '12px', borderRadius: '8px', cursor: 'pointer', marginBottom: '8px',
                            background: viewMode === 'schedule' ? 'rgba(255,255,255,0.05)' : 'transparent',
                            border: viewMode === 'schedule' ? '1px solid var(--glass-border)' : '1px solid transparent',
                            fontWeight: viewMode === 'schedule' ? 'bold' : 'normal'
                        }}
                    >
                        <span style={{ marginRight: '8px' }}>📅</span> שיבוצים
                    </div>
                </div>

                <div style={{ height: '1px', background: 'var(--glass-border)', margin: '0 16px' }}></div>

                {/* Units & Profiles Sidebar */}
                <div style={{ padding: '16px', overflowY: 'auto', flex: 1 }}>

                    {/* Unit Selector */}
                    <div style={{ marginBottom: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <p style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>יחידות / פלוגות:</p>
                            <button
                                onClick={createUnit}
                                className="btn-icon"
                                style={{
                                    width: '32px', height: '32px',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid var(--glass-border)'
                                }}
                            >
                                <Plus size={18} />
                            </button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {units.map(u => (
                                <div key={u.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    {/* Unit Item Header */}
                                    <div
                                        onClick={() => setActiveUnitId(activeUnitId === u.id ? null : u.id)}
                                        className="hover-actions-group"
                                        style={{
                                            padding: '10px 12px',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            // Removed fixed blue background, using simple active border or transparent
                                            background: activeUnitId === u.id ? 'rgba(57, 255, 20, 0.05)' : 'transparent',
                                            border: activeUnitId === u.id ? '1px solid var(--accent-color)' : '1px solid transparent',
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            {u.image_url && <img src={u.image_url} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />}
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ fontWeight: activeUnitId === u.id ? 'bold' : 'normal', fontSize: '0.95rem' }}>{u.title}</span>
                                                    {/* Member Count Badge - Muted & Aligned */}
                                                    <span style={{
                                                        fontSize: '0.75rem',
                                                        color: 'var(--text-secondary)',
                                                        opacity: 0.8,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        marginTop: '2px'
                                                    }}>
                                                        <User size={12} />
                                                        {unitStats[u.id] || 0}
                                                    </span>
                                                </div>
                                                {u.description && (
                                                    <span style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: '2px' }}>{u.description}</span>
                                                )}
                                            </div>
                                        </div>

                                        <button
                                            className="btn-icon unit-edit-btn action-buttons"
                                            onClick={(e) => handleEditUnit(u, e)}
                                            style={{
                                                width: '28px', height: '28px',
                                                transition: 'opacity 0.2s'
                                            }}
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                    </div>

                                    {/* Nested Profiles List (Accordion Body) */}
                                    <AnimatePresence>
                                        {activeUnitId === u.id && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                style={{ overflow: 'hidden' }}
                                            >
                                                <div style={{
                                                    paddingRight: '24px',
                                                    paddingLeft: '8px',
                                                    paddingBottom: '8px',
                                                    display: 'flex', flexDirection: 'column', gap: '4px'
                                                }}>

                                                    {loading ? (
                                                        <div style={{ padding: '8px', opacity: 0.5, fontSize: '0.8rem' }}>טוען תפקידים...</div>
                                                    ) : (
                                                        <>
                                                            {profiles.length === 0 ? (
                                                                <div style={{ padding: '8px', opacity: 0.5, fontSize: '0.8rem', fontStyle: 'italic' }}>אין תפקידים עדיין</div>
                                                            ) : (
                                                                profiles.map(p => {
                                                                    const profileCount = users.filter(usr => usr.unit_id === u.id && (usr.profile_id === p.id || usr.active_profile_id === p.id)).length;

                                                                    return (
                                                                        <div
                                                                            key={p.id}
                                                                            onClick={() => setActiveProfileId(p.id)}
                                                                            className="hover-actions-group"
                                                                            style={{
                                                                                padding: '8px 12px',
                                                                                borderRadius: '6px',
                                                                                cursor: 'pointer',
                                                                                background: activeProfileId === p.id ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                                                                borderLeft: activeProfileId === p.id ? '3px solid var(--accent-color)' : '3px solid transparent',
                                                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                                                fontSize: '0.9rem',
                                                                                color: activeProfileId === p.id ? 'var(--accent-color)' : 'var(--text-secondary)',
                                                                                fontWeight: activeProfileId === p.id ? '500' : 'normal',
                                                                                transition: 'all 0.2s',
                                                                                group: 'profile-item' // for hover targeting if using css modules, but using inline here
                                                                            }}
                                                                        >
                                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                                {p.title}
                                                                                <button
                                                                                    className="btn-icon profile-edit-btn action-buttons"
                                                                                    onClick={(e) => handleEditProfile(p, e)}
                                                                                    style={{
                                                                                        width: '24px', height: '24px', padding: '4px',
                                                                                        transition: 'opacity 0.2s'
                                                                                    }}
                                                                                >
                                                                                    <Edit2 size={12} />
                                                                                </button>
                                                                            </div>

                                                                            {/* Profile Member Count */}
                                                                            <span style={{
                                                                                fontSize: '0.75rem',
                                                                                color: 'var(--text-secondary)',
                                                                                opacity: 0.6,
                                                                                minWidth: '20px',
                                                                                textAlign: 'center'
                                                                            }}>
                                                                                {profileCount > 0 ? profileCount : '-'}
                                                                            </span>
                                                                        </div>
                                                                    );
                                                                })
                                                            )}

                                                            <button
                                                                onClick={createProfile}
                                                                style={{
                                                                    background: 'transparent',
                                                                    border: '1px dashed var(--glass-border)',
                                                                    borderRadius: '6px',
                                                                    padding: '8px',
                                                                    fontSize: '0.8rem',
                                                                    color: 'var(--text-secondary)',
                                                                    cursor: 'pointer',
                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                                                    marginTop: '4px',
                                                                    transition: 'all 0.2s'
                                                                }}
                                                                onMouseEnter={e => {
                                                                    e.currentTarget.style.borderColor = 'var(--accent-color)';
                                                                    e.currentTarget.style.color = 'var(--accent-color)';
                                                                }}
                                                                onMouseLeave={e => {
                                                                    e.currentTarget.style.borderColor = 'var(--glass-border)';
                                                                    e.currentTarget.style.color = 'var(--text-secondary)';
                                                                }}
                                                            >
                                                                <Plus size={12} />
                                                                הוסף תפקיד
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ marginTop: 'auto', padding: '16px', borderTop: '1px solid var(--glass-border)' }}>
                <p style={{ fontSize: '0.8rem', textAlign: 'center', opacity: 0.5 }}>גרסה 1.0.0</p>
            </div>
        </div >
    );
};

export default AdminSidebar;
