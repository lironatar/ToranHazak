import React from 'react';
import { X, Upload, Loader } from 'lucide-react';

const AdminEditUnitModal = ({ editingUnit, setEditingUnit, fileInputRef, handleImageChange, saveUnitChanges, isSavingUnit }) => {
    if (!editingUnit) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)', zIndex: 1100,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
            <div className="glass-card" style={{ maxWidth: '400px', width: '90%', padding: '32px', position: 'relative' }}>
                <button className="btn-icon" onClick={() => setEditingUnit(null)} style={{ position: 'absolute', top: '16px', left: '16px' }}><X /></button>

                <h3 style={{ marginBottom: '24px' }}>עריכת פלוגה</h3>

                <div style={{ marginBottom: '24px', textAlign: 'center' }}>
                    <div
                        style={{
                            width: '80px', height: '80px', borderRadius: '50%',
                            background: 'var(--bg-secondary)', margin: '0 auto 12px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: '2px dashed var(--glass-border)', overflow: 'hidden', cursor: 'pointer',
                            position: 'relative'
                        }}
                        onClick={() => fileInputRef.current.click()}
                    >
                        {editingUnit.image_url ? (
                            <img src={editingUnit.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <Upload size={24} opacity={0.5} />
                        )}
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleImageChange} style={{ display: 'none' }} accept="image/*" />
                    <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>לחץ על העיגול כדי לשנות סמל</p>
                </div>

                <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>שם הפלוגה</label>
                    <input
                        type="text"
                        value={editingUnit.title}
                        onChange={e => setEditingUnit({ ...editingUnit, title: e.target.value })}
                        className="input-modern"
                        style={{ width: '100%' }}
                    />
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
                    <button className="btn-primary" onClick={saveUnitChanges} disabled={isSavingUnit} style={{ minWidth: '120px' }}>
                        {isSavingUnit ? <Loader className="spin" size={20} /> : 'שמור שינויים'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminEditUnitModal;
