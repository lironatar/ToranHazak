import React from 'react';
import { CheckCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminRequests = ({ requests, handleRequestAction }) => {
    return (
        <div className="admin-content">
            <h2>בקשות הצטרפות ממתינות</h2>
            <p style={{ opacity: 0.7, marginBottom: '24px' }}>אשר או דחה בקשות הצטרפות של חיילים לפלוגות.</p>

            {requests.length === 0 ? (
                <div className="empty-state">
                    <CheckCircle size={48} color="var(--success-color)" style={{ marginBottom: '16px' }} />
                    <h3>אין בקשות ממתינות</h3>
                    <p>כל הבקשות טופלו, עבודה טובה!</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <AnimatePresence>
                        {requests.map(req => (
                            <motion.div
                                key={req.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                layout
                                className="glass-card"
                                style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    {/* User Avatar / Initials */}
                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                        {req.first_name[0]}{req.last_name[0]}
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0 }}>{req.first_name} {req.last_name}</h3>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', opacity: 0.7 }}>
                                            <span>מבקש להצטרף ל:</span>
                                            {req.unit_image && (
                                                <img src={req.unit_image} alt="" style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }} />
                                            )}
                                            <strong>{req.unit_title || 'לא ידוע'}</strong>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="btn-icon"
                                        onClick={() => handleRequestAction(req.id, 'approve')}
                                        style={{
                                            width: '40px', height: '40px',
                                            background: 'rgba(46, 204, 113, 0.15)',
                                            border: '1px solid var(--success-color)',
                                            color: 'var(--success-color)'
                                        }}
                                        title="אשר בקשה"
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                                            <CheckCircle size={20} />
                                        </div>
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="btn-icon"
                                        onClick={() => handleRequestAction(req.id, 'reject')}
                                        style={{
                                            width: '40px', height: '40px',
                                            background: 'rgba(255, 99, 71, 0.15)',
                                            border: '1px solid tomato',
                                            color: 'tomato'
                                        }}
                                        title="דחה בקשה"
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                                            <X size={20} />
                                        </div>
                                    </motion.button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};

export default AdminRequests;
