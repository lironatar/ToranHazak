import React, { useState } from 'react';
import {
    Edit2, Trash2, GripVertical, ChevronDown, Clock, Image as ImageIcon, X, Plus
} from 'lucide-react';
import { Reorder, useDragControls, AnimatePresence, motion } from 'framer-motion';
import ImageUploader from '../ImageUploader';
import SortableStep from './SortableStep';

const SortableMission = ({
    mission,
    levelId,
    isEditing,
    editingItem,
    setEditingItem,
    isExpanded,
    setExpandedMissionId,
    handleQuickUpdate,
    deleteItem,
    startEditing,
    saveEditing,
    cancelEditing,
    setLightboxSrc,
    handleStepReorder,
    createStep,
    newStep,
    setNewStep,
    showToast
}) => {
    const controls = useDragControls();
    // Use local state for dragging style if needed, but Reorder handles it mostly.

    // We need to prevent drag when interacting with internal elements
    // dragListener={false} means we MUST use controls.start(e)

    return (
        <Reorder.Item
            value={mission}
            id={mission.id}
            dragListener={!isEditing} // Disable drag if editing, or use handle
            dragControls={controls}
            whileDrag={{
                scale: 1.02,
                boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                zIndex: 50
            }}
            className="group"
            style={{ marginBottom: 'var(--space-2)' }}
        >
            {isEditing ? (
                // --- EDIT MODE ---
                <div className="glass-card" style={{ padding: 'var(--space-4)', border: '1px solid var(--accent-color)' }}>
                    <h4 style={{ marginBottom: 'var(--space-3)', color: 'var(--accent-color)' }}>עריכת משימה</h4>

                    {/* Main Fields */}
                    <div className="mobile-stack" style={{ gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                        <div style={{ flex: 1 }}>
                            <label className="text-label">כותרת</label>
                            <input
                                value={editingItem.data.title}
                                onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, title: e.target.value } })}
                                className="input-modern"
                                autoFocus
                            />
                        </div>
                        <div style={{ width: '80px' }}>
                            <label className="text-label">דקות</label>
                            <input
                                type="number"
                                value={editingItem.data.duration || 30}
                                onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, duration: parseInt(e.target.value) } })}
                                className="input-modern"
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: 'var(--space-3)' }}>
                        <label className="text-label">תיאור</label>
                        <input
                            value={editingItem.data.subtitle || ''}
                            onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, subtitle: e.target.value } })}
                            className="input-modern"
                        />
                    </div>

                    {/* Multi-Image Gallery */}
                    <div style={{ marginBottom: 'var(--space-4)' }}>
                        <label className="text-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>גלריית תמונות</span>
                            <span style={{ fontSize: '0.8em', opacity: 0.7 }}>{(() => {
                                try {
                                    const imgs = editingItem.data.images ? (typeof editingItem.data.images === 'string' ? JSON.parse(editingItem.data.images) : editingItem.data.images) : (editingItem.data.image_url ? [editingItem.data.image_url] : []);
                                    return `${imgs.length} תמונות`;
                                } catch { return '0 תמונות'; }
                            })()}</span>
                        </label>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                            {(() => {
                                let currentImages = [];
                                try {
                                    if (Array.isArray(editingItem.data.images)) currentImages = editingItem.data.images;
                                    else if (typeof editingItem.data.images === 'string') currentImages = JSON.parse(editingItem.data.images);
                                    else if (editingItem.data.image_url) currentImages = [editingItem.data.image_url];
                                } catch (e) { currentImages = []; }

                                return (
                                    <>
                                        {currentImages.map((imgUrl, idx) => (
                                            <div key={idx} style={{ position: 'relative', width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                                                <img src={imgUrl} alt={`img-${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                <button
                                                    onClick={() => {
                                                        const newImages = currentImages.filter((_, i) => i !== idx);
                                                        setEditingItem({
                                                            ...editingItem,
                                                            data: {
                                                                ...editingItem.data,
                                                                images: JSON.stringify(newImages),
                                                                image_url: newImages.length > 0 ? newImages[0] : ''
                                                            }
                                                        });
                                                    }}
                                                    style={{
                                                        position: 'absolute', top: 0, right: 0, background: 'rgba(0,0,0,0.6)', color: 'white',
                                                        border: 'none', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                                                    }}
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ))}
                                        <div style={{ width: '60px', height: '60px' }}>
                                            <ImageUploader
                                                currentImage={null}
                                                onUpload={(url) => {
                                                    const newImages = [...currentImages, url];
                                                    setEditingItem({
                                                        ...editingItem,
                                                        data: {
                                                            ...editingItem.data,
                                                            images: JSON.stringify(newImages),
                                                            image_url: newImages[0]
                                                        }
                                                    });
                                                }}
                                                notify={showToast}
                                                compact={true}
                                            />
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                            התמונה הראשונה תשמש כתמונה ראשית.
                        </p>
                    </div>

                    {/* Subtasks Manager of Edited Mission - SORTABLE */}
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--space-4)' }}>
                        <label className="text-label" style={{
                            marginBottom: 'var(--space-3)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            paddingBottom: '8px',
                            borderBottom: '1px solid rgba(255,255,255,0.1)'
                        }}>
                            <span>תתי-משימות</span>
                            <span style={{ opacity: 0.5, fontSize: '0.85em' }}>({mission.steps?.length || 0})</span>
                        </label>

                        {/* Sortable Steps List */}
                        <Reorder.Group
                            axis="y"
                            values={mission.steps || []}
                            onReorder={(newSteps) => handleStepReorder(levelId, mission.id, newSteps)}
                        >
                            {(mission.steps || []).map((step, index) => (
                                <SortableStep
                                    key={step.id}
                                    step={step}
                                    index={index}
                                    handleQuickUpdate={handleQuickUpdate}
                                    deleteItem={deleteItem}
                                />
                            ))}
                        </Reorder.Group>

                        {/* Add New Step Section */}
                        <div style={{
                            border: '2px dashed rgba(57, 255, 20, 0.3)',
                            borderRadius: '10px',
                            padding: '14px',
                            background: 'rgba(57, 255, 20, 0.02)',
                            marginTop: '16px'
                        }}>
                            <div style={{
                                fontSize: '0.85rem',
                                opacity: 0.7,
                                marginBottom: '10px',
                                textAlign: 'center',
                                fontWeight: 500
                            }}>
                                ➕ הוסף תת-משימה חדשה
                            </div>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                <input
                                    placeholder="לדוגמה: ניקיון שירותים"
                                    value={newStep.title}
                                    onChange={e => setNewStep({ ...newStep, title: e.target.value })}
                                    className="input-modern"
                                    style={{ flex: '1 1 200px', fontSize: '0.9rem' }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && newStep.title?.trim()) createStep(mission.id);
                                    }}
                                />
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input
                                        type="number"
                                        placeholder="דקות"
                                        value={newStep.duration || ''}
                                        onChange={e => setNewStep({ ...newStep, duration: parseInt(e.target.value) || 0 })}
                                        className="input-modern"
                                        style={{ width: '70px', fontSize: '0.9rem' }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && newStep.title?.trim()) createStep(mission.id);
                                        }}
                                    />
                                    <button
                                        onClick={() => {
                                            if (newStep.title?.trim()) {
                                                createStep(mission.id);
                                            } else {
                                                showToast('נא להזין שם לתת-משימה', 'error');
                                            }
                                        }}
                                        className="btn-primary"
                                        style={{
                                            padding: '8px 16px',
                                            minWidth: '60px',
                                            opacity: newStep.title?.trim() ? 1 : 0.5
                                        }}
                                        disabled={!newStep.title?.trim()}
                                    >
                                        <Plus size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mobile-stack" style={{ gap: 'var(--space-2)' }}>
                        <button onClick={saveEditing} className="btn-primary mobile-full-width">שמור שינויים</button>
                        <button onClick={cancelEditing} className="btn-secondary mobile-full-width">ביטול</button>
                    </div>
                </div>
            ) : (
                // --- READ ONLY MODE ---
                <div
                    className="mission-card compact-card mission-card-layout"
                >
                    {/* Top Row: Info */}
                    <div className="mission-info-area" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                        <div
                            className="swipe-indicator touch-target"
                            style={{ cursor: 'grab', opacity: 0.4, padding: '8px' }}
                            onPointerDown={(e) => controls.start(e)}
                        >
                            <GripVertical size={16} />
                        </div>

                        {/* Icon/Image Preview (Click to Lightbox) */}
                        <div
                            onClick={() => mission.image_url && setLightboxSrc({ src: mission.image_url, id: mission.id, type: 'mission' })}
                            style={{
                                width: '40px', height: '40px',
                                borderRadius: '8px',
                                background: mission.image_url ? `url(${mission.image_url}) center/cover` : 'rgba(255,255,255,0.05)',
                                border: '1px solid var(--glass-border)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: mission.image_url ? 'zoom-in' : 'default',
                                flexShrink: 0
                            }}
                        >
                            {!mission.image_url && <ImageIcon size={16} style={{ opacity: 0.3 }} />}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }} onClick={() => setExpandedMissionId(isExpanded ? null : mission.id)}>
                            <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {mission.title}
                            </div>
                            <div style={{ fontSize: '0.8rem', opacity: 0.6, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Clock size={10} />
                                <span>{mission.duration || 30} דק'</span>
                                {mission.subtitle && <span>• {mission.subtitle}</span>}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '4px' }}>
                            <button
                                onClick={(e) => { e.stopPropagation(); startEditing('mission', mission, e); }}
                                className="btn-icon muted-action-btn"
                                title="ערוך"
                            >
                                <Edit2 size={16} />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); deleteItem('mission', mission.id, mission.title); }}
                                className="btn-icon muted-action-btn"
                                style={{ color: 'var(--accent-danger)' }}
                            >
                                <Trash2 size={16} />
                            </button>
                            {/* Chevron for Subtasks */}
                            <button
                                onClick={(e) => { e.stopPropagation(); setExpandedMissionId(isExpanded ? null : mission.id); }}
                                className="btn-icon"
                                style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                            >
                                <ChevronDown size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Subtasks List (Expanded) */}
                    <AnimatePresence>
                        {isExpanded && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                style={{ overflow: 'hidden' }}
                            >
                                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--glass-border)', paddingRight: '12px' }}>
                                    {mission.steps && mission.steps.length > 0 ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            {mission.steps.map(step => (
                                                <div key={step.id} style={{ display: 'flex', alignItems: 'top', gap: '8px', fontSize: '0.9rem', opacity: 0.8 }}>
                                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-color)', marginTop: '6px' }}></div>
                                                    <span style={{ textDecoration: step.is_completed ? 'line-through' : 'none' }}>{step.title}</span>
                                                    <span style={{ opacity: 0.5, fontSize: '0.8em' }}>({step.duration} דק')</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p style={{ fontSize: '0.8rem', opacity: 0.5, fontStyle: 'italic' }}>אין תתי-משימות. לחץ על "עריכה" כדי להוסיף.</p>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </Reorder.Item>
    );
};

export default SortableMission;
