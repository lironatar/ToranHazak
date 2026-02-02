import React from 'react';
import { Clock, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminLevelCreationModal = ({ showLevelModal, setShowLevelModal, newLevelData, setNewLevelData, createLevel }) => {
    return (
        <AnimatePresence>
            {showLevelModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)',
                    zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }} onClick={() => setShowLevelModal(false)}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        onClick={e => e.stopPropagation()}
                        className="glass-card"
                        style={{ width: '100%', maxWidth: '450px', padding: '32px', border: '1px solid var(--glass-border)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                            <div style={{ padding: '16px', background: 'rgba(59, 130, 246, 0.15)', borderRadius: '16px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                                <Clock size={32} color="var(--accent-color)" />
                            </div>
                            <div>
                                <h2 style={{ fontSize: '1.6rem', margin: 0, fontWeight: '800' }}>יצירת מסגרת משימות</h2>
                                <p style={{ margin: '4px 0 0', opacity: 0.6, fontSize: '0.95rem' }}>הגדר בלוק חדש בלו"ז</p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--text-primary)' }}>כותרת המסגרת</label>
                                <input
                                    type="text"
                                    placeholder="לדוגמה: מסדר בוקר, בדיקת ציוד..."
                                    value={newLevelData.title}
                                    onChange={e => setNewLevelData({ ...newLevelData, title: e.target.value })}
                                    className="input-modern"
                                    style={{ width: '100%', padding: '14px', fontSize: '1.1rem' }}
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--text-primary)' }}>שעת יעד (אופציונלי)</label>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <input
                                        type="time"
                                        value={newLevelData.target_time}
                                        onChange={e => setNewLevelData({ ...newLevelData, target_time: e.target.value })}
                                        className="input-modern"
                                        style={{ flex: 1, padding: '12px' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                                    {['08:00', '10:00', '12:00', '14:00', '18:00', '22:00'].map(t => (
                                        <button
                                            key={t}
                                            onClick={() => setNewLevelData({ ...newLevelData, target_time: t })}
                                            style={{
                                                padding: '6px 12px',
                                                borderRadius: '8px',
                                                background: newLevelData.target_time === t ? 'var(--accent-color)' : 'var(--bg-secondary)',
                                                color: newLevelData.target_time === t ? 'white' : 'var(--text-secondary)',
                                                border: '1px solid var(--glass-border)',
                                                fontSize: '0.85rem',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'row-reverse', gap: '12px', marginTop: '12px', paddingTop: '20px', borderTop: '1px solid var(--glass-border)' }}>
                                <button
                                    className="btn-primary"
                                    onClick={createLevel}
                                    style={{ flex: 1, justifyContent: 'center', padding: '16px', fontSize: '1.1rem' }}
                                    disabled={!newLevelData.title}
                                >
                                    <Plus size={20} style={{ marginLeft: '8px' }} />
                                    צור מסגרת
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default AdminLevelCreationModal;
