import React from 'react';
import { Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminCreationModal = ({ creationModal, setCreationModal, handleCreateSubmit, isSavingUnit }) => {
    return (
        <AnimatePresence>
            {
                creationModal.show && (
                    <div
                        style={{
                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                            background: 'rgba(0,0,0,0.7)',
                            zIndex: 1000,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            backdropFilter: 'blur(5px)'
                        }}
                        onClick={() => setCreationModal({ ...creationModal, show: false })}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="glass-card"
                            style={{ width: '480px', padding: '32px', position: 'relative' }}
                            onClick={e => e.stopPropagation()}
                            onKeyDown={(e) => {
                                if (e.key === 'Escape') setCreationModal({ ...creationModal, show: false });
                            }}
                        >
                            <h2 style={{ marginBottom: '24px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                                <div style={{
                                    background: 'rgba(59, 130, 246, 0.1)',
                                    padding: '8px', borderRadius: '50%', color: 'var(--accent-color)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <Plus size={24} />
                                </div>
                                {creationModal.type === 'sub_unit' ? 'יצירת פלוגה חדשה' : 'יצירת תפקיד חדש'}
                            </h2>

                            <form onSubmit={handleCreateSubmit}>
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', opacity: 0.9, fontWeight: '500', textAlign: 'right' }}>שם:</label>
                                    <input
                                        type="text"
                                        className="input-modern"
                                        value={creationModal.title}
                                        onChange={e => {
                                            setCreationModal({ ...creationModal, title: e.target.value });
                                            if (creationModal.error) setCreationModal({ ...creationModal, error: null });
                                        }}
                                        placeholder={creationModal.type === 'sub_unit' ? 'לדוגמה: פלוגה ג\' - מחלקה 2' : 'לדוגמה: נהג כונן'}
                                        required
                                        autoFocus
                                        style={{
                                            textAlign: 'right',
                                            borderColor: creationModal.error ? '#ff4d4d' : 'var(--glass-border)'
                                        }}
                                    />
                                    {creationModal.error && (
                                        <p style={{ color: '#ff4d4d', fontSize: '0.85rem', marginTop: '4px', textAlign: 'right' }}>
                                            {creationModal.error}
                                        </p>
                                    )}
                                </div>

                                <div style={{ marginBottom: '24px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', opacity: 0.9, fontWeight: '500', textAlign: 'right' }}>תיאור (אופציונלי):</label>
                                    <textarea
                                        className="input-modern"
                                        value={creationModal.desc}
                                        onChange={e => setCreationModal({ ...creationModal, desc: e.target.value })}
                                        placeholder="תיאור קצר..."
                                        style={{
                                            textAlign: 'right',
                                            minHeight: '100px',
                                            resize: 'vertical',
                                            fontFamily: 'inherit'
                                        }}
                                    />
                                    <p style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: '4px', textAlign: 'right' }}>
                                        מיועד להערות פנימיות בלבד
                                    </p>
                                </div>

                                <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-start', flexDirection: 'row-reverse' }}>
                                    <button
                                        type="submit"
                                        className="btn-primary"
                                        disabled={isSavingUnit} // Re-using isSavingUnit generic "loading" concept or create new one?
                                        style={{
                                            flex: 1,
                                            opacity: isSavingUnit ? 0.7 : 1,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                        }}
                                    >
                                        {isSavingUnit ? (
                                            <>
                                                <span className="spinner-small"></span> יוצר...
                                            </>
                                        ) : 'יצירה'}
                                    </button>

                                    <button
                                        type="button"
                                        className="btn-secondary"
                                        onClick={() => setCreationModal({ ...creationModal, show: false })}
                                        style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)' }}
                                    >
                                        ביטול
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )
            }
        </AnimatePresence >
    );
};

export default AdminCreationModal;
