import React, { useState } from 'react';
import { Plus, Edit2, Trash2, GripVertical, Check, X, Clock, ChevronDown, Image as ImageIcon, Layout, Activity } from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import SortableMission from './SortableMission';
import ImageUploader from '../ImageUploader';
import Lightbox from '../Lightbox';
import MobileTimePicker from '../MobileTimePicker';
import AdminLiveTracking from './AdminLiveTracking';

const AdminContent = ({
    activeUnitId,
    activeProfileId,
    createProfile,
    profiles,
    contentTree,
    activeLevelId,
    setActiveLevelId,
    editingTitleId,
    setEditingTitleId,
    handleQuickUpdate,
    deleteItem,
    editingItem,
    setEditingItem,
    handleMissionReorder,
    handleStepReorder,
    startEditing,
    saveEditing,
    cancelEditing,
    creatingMissionInLevelId,
    setCreatingMissionInLevelId,
    newMission,
    setNewMission,
    createMission,
    createStep,
    newStep,
    setNewStep,
    setShowLevelModal,
    showToast
}) => {

    const [lightboxSrc, setLightboxSrc] = useState(null);
    const [expandedMissionId, setExpandedMissionId] = useState(null);
    const [mode, setMode] = useState('editor'); // 'editor' | 'tracking'

    const getLevels = () => {
        if (!contentTree || !Array.isArray(contentTree)) return [];
        return contentTree;
    };

    const levels = getLevels();

    // Calculate total duration for a level
    const calculateLevelDuration = (missions) => {
        return missions.reduce((total, m) => total + (m.duration || 0), 0);
    };

    if (!activeUnitId) {
        return (
            <div className="empty-state">
                <div style={{ fontSize: '4rem', marginBottom: '16px' }}>👈</div>
                <h2>בחר יחידה מהתפריט</h2>
            </div>
        );
    }

    if (!activeProfileId || profiles.length === 0) {
        return (
            <div className="empty-state">
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📋</div>
                <h2>בחר או צור תפקיד</h2>
                <button
                    onClick={createProfile}
                    className="btn-primary touch-target"
                    style={{ width: 'auto', marginTop: '16px' }}
                >
                    <Plus size={18} /> הוסף תפקיד חדש
                </button>
            </div>
        );
    }

    return (
        <div className="admin-content-container">
            <Lightbox
                src={lightboxSrc?.src}
                isOpen={!!lightboxSrc}
                onClose={() => setLightboxSrc(null)}
                onEdit={lightboxSrc?.type === 'mission' ? (url) => {
                    handleQuickUpdate('mission', lightboxSrc.id, 'image_url', url);
                    setLightboxSrc(prev => ({ ...prev, src: url }));
                    showToast('תמונה עודכנה בהצלחה');
                } : undefined}
            />

            {/* Header - Mobile Optimized with TABS */}
            <div className="content-header mobile-stack" style={{ alignItems: 'flex-start', marginBottom: 'var(--space-6)', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'bold', marginBottom: 'var(--space-2)' }}>
                            {mode === 'editor' ? 'ניהול משימות' : 'מעקב חי'}
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                            {mode === 'editor' ? 'הגדר סדר יום, משימות וזמנים' : 'צפה בהתקדמות החיילים בזמן אמת'}
                        </p>
                    </div>

                    {/* VIEW TOGGLE */}
                    <div style={{ display: 'flex', background: 'var(--bg-secondary)', padding: '4px', borderRadius: '12px', gap: '4px' }}>
                        <button
                            onClick={() => setMode('editor')}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                                background: mode === 'editor' ? 'var(--accent-color)' : 'transparent',
                                color: mode === 'editor' ? 'white' : 'var(--text-secondary)',
                                fontWeight: 500
                            }}
                        >
                            <Layout size={16} /> עריכה
                        </button>
                        <button
                            onClick={() => setMode('tracking')}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                                background: mode === 'tracking' ? 'var(--accent-color)' : 'transparent',
                                color: mode === 'tracking' ? 'white' : 'var(--text-secondary)',
                                fontWeight: 500
                            }}
                        >
                            <Activity size={16} /> מעקב חי
                        </button>
                    </div>
                </div>

                {mode === 'editor' && (
                    <button
                        onClick={() => setShowLevelModal(true)}
                        className="btn-secondary touch-target mobile-full-width"
                        style={{ width: '100%', borderStyle: 'dashed', opacity: 0.8 }}
                    >
                        <Plus size={18} /> בלוק חדש
                    </button>
                )}
            </div>

            {/* CONTENT SWITCHER */}
            {mode === 'tracking' ? (
                <AdminLiveTracking
                    activeUnitId={activeUnitId}
                    contentTree={contentTree}
                    showToast={showToast}
                />
            ) : (
                /* Levels List (EDITOR) */
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                    {levels.length === 0 ? (
                        <div className="glass-card" style={{ textAlign: 'center', padding: 'var(--space-8)', borderStyle: 'dashed' }}>
                            <p style={{ opacity: 0.6, marginBottom: 'var(--space-4)' }}>אין משימות עדיין לתפקיד זה</p>
                            <button onClick={() => setShowLevelModal(true)} className="btn-secondary touch-target">
                                צור את הבלוק הראשון
                            </button>
                        </div>
                    ) : (
                        levels.map((level) => {
                            const isExpanded = activeLevelId === level.id;
                            const totalDuration = calculateLevelDuration(level.missions);

                            return (
                                <motion.div
                                    key={level.id}
                                    className="level-card glass-card group"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    style={{ padding: 0, overflow: 'hidden' }}
                                >
                                    {/* Level Header - GRID AREAS LAYOUT */}
                                    <div
                                        className="level-header touch-target level-header-layout"
                                        onClick={() => setActiveLevelId(isExpanded ? null : level.id)}
                                        style={{
                                            background: 'rgba(255,255,255,0.03)',
                                            padding: 'var(--space-4)',
                                            cursor: 'pointer',
                                            borderBottom: isExpanded ? '1px solid var(--glass-border)' : 'none',
                                            minHeight: '80px'
                                        }}
                                    >
                                        {/* TIME AREA */}
                                        <div className="header-time-area" onClick={(e) => e.stopPropagation()}>
                                            <MobileTimePicker
                                                value={level.target_time}
                                                onChange={(time) => handleQuickUpdate('level', level.id, 'target_time', time)}
                                                placeholder="--:--"
                                            />
                                        </div>

                                        {/* TITLE AREA */}
                                        <div className="header-title-area" style={{ overflow: 'hidden' }}>
                                            {editingTitleId === level.id ? (
                                                <input
                                                    autoFocus
                                                    defaultValue={level.title}
                                                    className="input-modern"
                                                    style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 'bold', width: '100%' }}
                                                    onBlur={(e) => {
                                                        handleQuickUpdate('level', level.id, 'title', e.target.value);
                                                        setEditingTitleId(null);
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            handleQuickUpdate('level', level.id, 'title', e.target.value);
                                                            setEditingTitleId(null);
                                                        }
                                                    }}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            ) : (
                                                <h3
                                                    className="editable-title"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditingTitleId(level.id);
                                                    }}
                                                    style={{
                                                        fontSize: 'var(--text-lg)',
                                                        fontWeight: 'bold',
                                                        margin: 0,
                                                        marginBottom: 'var(--space-1)'
                                                    }}
                                                >
                                                    {level.title}
                                                </h3>
                                            )}
                                        </div>

                                        {/* METADATA AREA */}
                                        <div className="header-meta-area">
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 'var(--space-2)',
                                                fontSize: 'var(--text-xs)',
                                                color: 'var(--text-secondary)',
                                                flexWrap: 'wrap'
                                            }}>
                                                <span>{level.missions.length} משימות</span>
                                                {totalDuration > 0 && (
                                                    <>
                                                        <span>•</span>
                                                        <span className="time-badge">{totalDuration} דק'</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* ACTIONS AREA */}
                                        <div className="header-actions-area" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                            <button
                                                className="btn-icon muted-action-btn touch-target"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (window.confirm('למחוק את הבלוק וכל המשימות שבו?')) deleteItem('level', level.id);
                                                }}
                                                style={{ color: 'var(--accent-danger)' }}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                            <ChevronDown
                                                size={20}
                                                style={{
                                                    transition: 'transform var(--transition-base)',
                                                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                                    color: 'var(--text-secondary)'
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Level Content - Missions */}
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                style={{ overflow: 'hidden' }}
                                            >
                                                <div style={{ padding: 'var(--space-4)', background: 'rgba(0,0,0,0.15)' }}>

                                                    {/* Missions */}
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                                                        <Reorder.Group
                                                            axis="y"
                                                            values={level.missions}
                                                            onReorder={(newOrder) => handleMissionReorder(level.id, newOrder)}
                                                        >
                                                            {level.missions.map((mission) => (
                                                                <SortableMission
                                                                    key={mission.id}
                                                                    mission={mission}
                                                                    levelId={level.id}
                                                                    isEditing={editingItem?.id === mission.id && editingItem?.type === 'mission'}
                                                                    editingItem={editingItem}
                                                                    setEditingItem={setEditingItem}
                                                                    isExpanded={expandedMissionId === mission.id}
                                                                    setExpandedMissionId={setExpandedMissionId}
                                                                    handleQuickUpdate={handleQuickUpdate}
                                                                    deleteItem={deleteItem}
                                                                    startEditing={startEditing}
                                                                    saveEditing={saveEditing}
                                                                    cancelEditing={cancelEditing}
                                                                    setLightboxSrc={setLightboxSrc}
                                                                    handleStepReorder={handleStepReorder}
                                                                    createStep={createStep}
                                                                    newStep={newStep}
                                                                    setNewStep={setNewStep}
                                                                    showToast={showToast}
                                                                />
                                                            ))}
                                                        </Reorder.Group>
                                                    </div>

                                                    {/* Add Mission Button */}
                                                    {
                                                        creatingMissionInLevelId === level.id ? (
                                                            <div className="glass-card" style={{
                                                                marginTop: 'var(--space-4)',
                                                                border: '1px solid var(--accent-color)',
                                                                padding: 'var(--space-4)'
                                                            }}>
                                                                <h4 style={{ marginBottom: 'var(--space-3)', color: 'var(--accent-color)', fontSize: 'var(--text-base)' }}>
                                                                    משימה חדשה
                                                                </h4>

                                                                <div className="mobile-stack" style={{ marginBottom: 'var(--space-3)' }}>
                                                                    <div style={{ flex: 1 }}>
                                                                        <label style={{ fontSize: 'var(--text-xs)', opacity: 0.7, display: 'block', marginBottom: 'var(--space-1)' }}>כותרת</label>
                                                                        <input
                                                                            value={newMission.title}
                                                                            onChange={(e) => setNewMission({ ...newMission, title: e.target.value })}
                                                                            className="input-modern"
                                                                            autoFocus
                                                                            placeholder="לדוגמה: מסדר בוקר"
                                                                        />
                                                                    </div>
                                                                    <div style={{ flex: '0 0 auto', width: '120px' }}>
                                                                        <label style={{ fontSize: 'var(--text-xs)', opacity: 0.7, display: 'block', marginBottom: 'var(--space-1)' }}>דקות</label>
                                                                        <input
                                                                            type="number"
                                                                            value={newMission.duration}
                                                                            onChange={(e) => setNewMission({ ...newMission, duration: parseInt(e.target.value) })}
                                                                            className="input-modern"
                                                                            min="1"
                                                                        />
                                                                    </div>
                                                                </div>

                                                                <div style={{ marginBottom: 'var(--space-3)' }}>
                                                                    <label style={{ fontSize: 'var(--text-xs)', opacity: 0.7, display: 'block', marginBottom: 'var(--space-1)' }}>תיאור (אופציונלי)</label>
                                                                    <input
                                                                        value={newMission.subtitle}
                                                                        onChange={(e) => setNewMission({ ...newMission, subtitle: e.target.value })}
                                                                        className="input-modern"
                                                                        placeholder="פרטים נוספים..."
                                                                    />
                                                                </div>

                                                                <div style={{ marginBottom: 'var(--space-3)' }}>
                                                                    <label style={{ fontSize: 'var(--text-xs)', opacity: 0.7, display: 'block', marginBottom: 'var(--space-1)' }}>תמונה (אופציונלי)</label>
                                                                    <ImageUploader
                                                                        onUpload={(url) => setNewMission({ ...newMission, image_url: url })}
                                                                        currentImage={newMission.image_url}
                                                                        onRemove={() => setNewMission({ ...newMission, image_url: null })}
                                                                        notify={showToast}
                                                                    />
                                                                </div>

                                                                <div className="mobile-stack">
                                                                    <button onClick={() => createMission(level.id)} className="btn-primary touch-target mobile-full-width">
                                                                        שמור משימה
                                                                    </button>
                                                                    <button onClick={() => setCreatingMissionInLevelId(null)} className="btn-secondary touch-target mobile-full-width">
                                                                        ביטול
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => {
                                                                    setNewMission({ title: '', subtitle: '', duration: 30, image_url: null });
                                                                    setCreatingMissionInLevelId(level.id);
                                                                }}
                                                                className="btn-secondary touch-target"
                                                                style={{ width: '100%', marginTop: 'var(--space-4)', borderStyle: 'dashed', opacity: 0.7 }}
                                                            >
                                                                <Plus size={16} /> הוסף משימה
                                                            </button>
                                                        )
                                                    }
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
};

export default AdminContent;
