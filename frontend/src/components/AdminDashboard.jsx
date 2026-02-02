import React, { useState, useEffect, useRef } from 'react';
import { Menu, CheckCircle } from 'lucide-react';
import AdminSidebar from './admin/AdminSidebar';
import AdminRequests from './admin/AdminRequests';
import AdminUsers from './admin/AdminUsers';
import AdminSchedule from './admin/AdminSchedule';
import AdminContent from './admin/AdminContent';
import AdminCreationModal from './admin/AdminCreationModal';
import AdminEditUnitModal from './admin/AdminEditUnitModal';
import AdminLevelCreationModal from './admin/AdminLevelCreationModal';

const AdminDashboard = () => {
    const [units, setUnits] = useState([]);
    const [activeUnitId, setActiveUnitId] = useState(null);
    const [profiles, setProfiles] = useState([]);
    const [activeProfileId, setActiveProfileId] = useState(null);
    const [contentTree, setContentTree] = useState([]); // Levels -> Missions -> Steps
    const [loading, setLoading] = useState(true);

    // UI State
    const [activeLevelId, setActiveLevelId] = useState(null);
    const [activeMissionId, setActiveMissionId] = useState(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const [viewMode, setViewMode] = useState('content'); // 'content', 'requests', 'users'

    // Requests State
    const [requests, setRequests] = useState([]);
    const [users, setUsers] = useState([]); // All users
    const [unitStats, setUnitStats] = useState({}); // Map of unitId -> count

    // Editing State
    const [editingItem, setEditingItem] = useState(null); // { type: 'level'|'mission'|'step', id: 1, data: {...} }
    const [draggingId, setDraggingId] = useState(null); // For Drag & Drop

    // Creation Modal State
    const [creationModal, setCreationModal] = useState({ show: false, type: 'sub_unit', title: '', desc: '' }); // type: 'sub_unit' | 'profile'
    const [showLevelModal, setShowLevelModal] = useState(false);

    // New Item Forms
    const [newLevelData, setNewLevelData] = useState({ title: '', target_time: '' });
    const [newMission, setNewMission] = useState({ title: '', description: '', duration: '', target_time: '' });
    const [newStep, setNewStep] = useState({ title: '', subtitle: '', description: '', duration: '' });

    // Edit Unit State
    const [editingUnit, setEditingUnit] = useState(null); // { id: 1, title: '...', image_url: '...' }
    const [isSavingUnit, setIsSavingUnit] = useState(false);
    const fileInputRef = useRef(null);

    // Toast State
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
    };

    useEffect(() => {
        fetchUnits();
        fetchRequests();
        fetchStats();
        fetchUsers();
        const interval = setInterval(() => {
            fetchRequests();
            fetchStats();
        }, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (activeUnitId) {
            fetchProfiles(activeUnitId);
        } else {
            setProfiles([]);
            setActiveProfileId(null);
        }
    }, [activeUnitId]);

    useEffect(() => {
        if (activeProfileId) {
            fetchContent(activeProfileId);
        }
    }, [activeProfileId]);

    const fetchUnits = async () => {
        try {
            const res = await fetch('/api/units');
            const data = await res.json();
            setUnits(data);
            if (data.length > 0 && !activeUnitId) setActiveUnitId(data[0].id);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchProfiles = async (unitId) => {
        try {
            const res = await fetch(`/api/profiles?unit_id=${unitId}`);
            const data = await res.json();
            setProfiles(data);
            if (data.length > 0) setActiveProfileId(data[0].id);
            else setActiveProfileId(null);
            setLoading(false);
        } catch (err) {
            console.error(err);
        }
    };

    // New Unit/Profile Creation
    // --- CREATION HANDLERS (Modal) ---

    // Open Modal
    const createUnit = () => setCreationModal({ show: true, type: 'sub_unit', title: '', desc: '' });
    const createProfile = () => setCreationModal({ show: true, type: 'profile', title: '', desc: '' });

    // Submit Creation
    const handleCreateSubmit = async (e) => {
        if (e) e.preventDefault();
        const { type, title, desc } = creationModal;

        if (!title || !title.trim()) {
            setCreationModal(prev => ({ ...prev, error: 'יש להזין שם' }));
            return;
        }

        setIsSavingUnit(true);
        try {
            if (type === 'sub_unit') {
                await fetch('/api/units', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title, description: desc, image_url: '' })
                });
                fetchUnits();
                showToast('פלוגה נוצרה בהצלחה');
            } else if (type === 'profile') {
                if (!activeUnitId) {
                    setIsSavingUnit(false);
                    return alert('אנא בחר פלוגה קודם');
                }
                await fetch('/api/profiles', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ unit_id: activeUnitId, title, description: desc })
                });
                fetchProfiles(activeUnitId);
                showToast('תפקיד נוצר בהצלחה');
            } else if (type === 'profile_edit') {
                await fetch(`/api/profiles/${creationModal.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title, description: desc })
                });
                // Update local list manually to avoid refetch flicker or just refetch
                fetchProfiles(activeUnitId);
                showToast('תפקיד עודכן בהצלחה');
            }
            setCreationModal({ show: false, type: 'sub_unit', title: '', desc: '', error: null });
        } catch (err) {
            console.error(err);
            showToast('שגיאה ביצירה/עריכה', 'error');
        } finally {
            setIsSavingUnit(false);
        }
    };

    const handleEditProfile = (profile, e) => {
        e.stopPropagation();
        setCreationModal({
            show: true,
            type: 'profile_edit',
            title: profile.title || '',
            desc: profile.description || '',
            id: profile.id
        });
    };
    const createMission = async (levelId) => {
        if (!newMission.title) return;

        await fetch('/api/missions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...newMission, level_id: levelId })
        });
        showToast('תת-משימה נוצרה בהצלחה');
        setNewMission({ title: '', description: '', duration: '', target_time: '' }); // Reset
        setCreatingMissionInLevelId(null); // Close Inline Creator
        fetchContent(activeProfileId);
    };

    const fetchContent = async (profileId) => {
        try {
            const res = await fetch(`/api/profiles/${profileId}/content`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setContentTree(data);
            } else {
                console.error("Content format error:", data);
                setContentTree([]);
            }
        } catch (err) {
            console.error(err);
            setContentTree([]);
        }
    };

    const fetchRequests = async () => {
        try {
            const res = await fetch('/api/admin/requests');
            const data = await res.json();
            setRequests(data);
        } catch (err) {
            console.error("Failed to fetch requests", err);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/admin/stats');
            const data = await res.json();
            // Convert plogaStats array to map: { unitId: count }
            const statsMap = {};
            if (data.plogaStats) {
                data.plogaStats.forEach(stat => {
                    statsMap[stat.id] = stat.count; // Ensure backend returns id
                });
            }
            setUnitStats(statsMap);
        } catch (err) {
            console.error("Failed to fetch stats:", err);
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/admin/users');
            const data = await res.json();
            setUsers(data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleRequestAction = async (guestId, action) => {
        try {
            await fetch(`/api/admin/requests/${guestId}/${action}`, { method: 'POST' });
            showToast(action === 'approve' ? 'בקשה אושרה' : 'בקשה נדחתה');
            fetchRequests();
        } catch (err) {
            console.error(err);
        }
    };

    // --- CRUD OPS ---

    const createLevel = async () => {
        if (!activeProfileId || !newLevelData.title) return; // Basic validation
        try {
            await fetch('/api/levels', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...newLevelData, profile_id: activeProfileId })
            });

            // Success Handling
            fetchContent(activeProfileId);
            setNewLevelData({ title: '', target_time: '' }); // Reset
            setShowLevelModal(false); // Close Modal if open
            showToast('משימה ראשית נוצרה בהצלחה');
        } catch (err) {
            console.error(err);
            showToast('שגיאה ביצירה', 'error');
        }
    };
    const createStep = async (missionId) => {
        if (!newStep.title) return;
        await fetch('/api/steps', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...newStep, mission_id: missionId })
        });
        setNewStep({ title: '', subtitle: '', description: '', duration: '' });
        showToast('צעד נוסף בהצלחה!');
        fetchContent(activeProfileId);
    };

    const deleteItem = async (type, id) => {
        if (!window.confirm('האם אתה בטוח?')) return;
        await fetch(`/api/${type}/${id}`, { method: 'DELETE' });
        fetchContent(activeProfileId);
    };

    const startEditing = (type, item, e) => {
        e.stopPropagation();
        setEditingItem({ type, id: item.id, data: { ...item } });
    };

    const cancelEditing = (e) => {
        e.stopPropagation();
        setEditingItem(null);
    };

    const saveEditing = async (e) => {
        e.stopPropagation();
        if (!editingItem) return;
        const { type, id, data } = editingItem;

        try {
            await fetch(`/api/${type}s/${id}`, { // pluralize type for url
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            showToast('שינויים נשמרו');
        } catch (err) {
            console.error(err);
            showToast('שגיאה בשמירה', 'error');
        }
        setEditingItem(null);
        fetchContent(activeProfileId);
    };

    // --- QUICK INLINE UPDATES (Title & Time) ---
    const [editingTitleId, setEditingTitleId] = useState(null); // ID of level currently editing title
    const [editingMissionTitleId, setEditingMissionTitleId] = useState(null); // ID of mission currently editing title
    const [creatingMissionInLevelId, setCreatingMissionInLevelId] = useState(null); // ID of level where we are creating a mission

    const handleQuickUpdate = async (type, id, field, value) => {
        // Backend Update
        try {
            await fetch(`/api/${type}s/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [field]: value })
            });
            fetchContent(activeProfileId); // Refresh Data
        } catch (err) {
            console.error(err);
            showToast('שגיאה בעדכון', 'error');
        }
    };


    // --- DRAG & DROP (Reorder) ---
    const saveTimeoutRef = useRef(null);

    const handleMissionReorder = (levelId, newMissions) => {
        // 1. Update Local State Immediately
        const newTree = contentTree.map(l => {
            if (l.id === levelId) return { ...l, missions: newMissions };
            return l;
        });
        setContentTree(newTree);

        // 2. Debounce Save to Backend
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(async () => {
            const updates = newMissions.map((m, index) => ({ id: m.id, display_order: index }));
            try {
                await fetch('/api/missions/reorder', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ updates })
                });
                // showToast('סדר המשימות נשמר'); // Optional: don't spam toasts
            } catch (err) {
                console.error("Failed to save mission order", err);
            }
        }, 1000);
    };

    const handleStepReorder = (levelId, missionId, newSteps) => {
        // 1. Update Local State
        const newTree = contentTree.map(l => {
            if (l.id !== levelId) return l;
            const newMissions = l.missions.map(m => {
                if (m.id !== missionId) return m;
                return { ...m, steps: newSteps };
            });
            return { ...l, missions: newMissions };
        });
        setContentTree(newTree);

        // 2. Debounce Save
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(async () => {
            const updates = newSteps.map((s, index) => ({ id: s.id, display_order: index }));
            try {
                await fetch('/api/steps/reorder', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ updates })
                });
            } catch (err) {
                console.error("Failed to save step order", err);
            }
        }, 1000);
    };

    // Removed old HTML5 handlers (handleMissionDragStart, handleMissionDrop) as they are replaced by Reorder logic


    // --- UNIT EDITING ---

    const handleEditUnit = (unit, e) => {
        e.stopPropagation();
        setEditingUnit({ ...unit });
    };

    const deleteUser = async (userId) => {
        if (!window.confirm('האם אתה בטוח שברצונך למחוק משתמש זה?')) return;
        try {
            await fetch(`/api/guests/${userId}`, { method: 'DELETE' });
            showToast('משתמש נמחק בהצלחה');
            fetchUsers();
            fetchRequests(); // Update requests count if pending
        } catch (err) {
            console.error("Failed to delete user", err);
            showToast('שגיאה במחיקת משתמש', 'error');
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            setEditingUnit(prev => ({ ...prev, image_url: reader.result }));
        };
        reader.readAsDataURL(file);
    };

    const saveUnitChanges = async () => {
        if (!editingUnit) return;
        setIsSavingUnit(true);
        try {
            await fetch(`/api/units/${editingUnit.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingUnit)
            });
            showToast('פרטי הפלוגה עודכנו בהצלחה');
            setEditingUnit(null);
            fetchUnits();
        } catch (err) {
            console.error(err);
            showToast('שגיאה בשמירת השינויים', 'error');
        } finally {
            setIsSavingUnit(false);
        }
    };

    if (loading) return <div>טוען...</div>;

    return (
        <div style={{ display: 'flex', minHeight: '100vh', direction: 'rtl' }}>

            {/* TOAST NOTIFICATION */}
            <div style={{
                position: 'fixed',
                top: '20px',
                left: '50%',
                transform: `translateX(-50%) translateY(${toast.show ? '0' : '-100px'})`,
                background: 'var(--success-color)',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '50px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                zIndex: 1000,
                transition: 'all 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55)',
                opacity: toast.show ? 1 : 0
            }}>
                <CheckCircle size={20} color="white" />
                <span style={{ fontWeight: 'bold' }}>{toast.message}</span>
            </div>

            {/* MOBILE HEADER TOGGLE (Floating) */}
            <div className="mobile-only" style={{ position: 'fixed', top: '16px', left: '16px', zIndex: 100, display: 'none' }}>
                <button
                    className="btn-icon"
                    onClick={() => setMenuOpen(!menuOpen)}
                    style={{
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--accent-color)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                        width: '48px', height: '48px', borderRadius: '50%'
                    }}
                >
                    <Menu color="var(--accent-color)" />
                </button>
            </div>

            {/* SIDEBAR */}
            <AdminSidebar
                menuOpen={menuOpen}
                viewMode={viewMode}
                setViewMode={setViewMode}
                requests={requests}
                units={units}
                activeUnitId={activeUnitId}
                setActiveUnitId={setActiveUnitId}
                unitStats={unitStats}
                profiles={profiles}
                activeProfileId={activeProfileId}
                setActiveProfileId={setActiveProfileId}
                loading={loading}
                users={users}
                createUnit={createUnit}
                handleEditUnit={handleEditUnit}
                handleEditProfile={handleEditProfile}
                createProfile={createProfile}
            />

            {/* MAIN CONTENT */}
            <main style={{ flex: 1, padding: '32px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>

                {viewMode === 'requests' ? (
                    <AdminRequests
                        requests={requests}
                        handleRequestAction={handleRequestAction}
                    />
                ) : viewMode === 'users' ? (
                    <AdminUsers
                        users={users}
                        deleteUser={deleteUser}
                    />
                ) : viewMode === 'schedule' ? (
                    <AdminSchedule
                        activeUnitId={activeUnitId}
                        users={users}
                    />
                ) : (
                    <AdminContent
                        activeUnitId={activeUnitId}
                        activeProfileId={activeProfileId}
                        createProfile={createProfile}
                        profiles={profiles}
                        contentTree={contentTree}
                        activeLevelId={activeLevelId}
                        setActiveLevelId={setActiveLevelId}
                        editingTitleId={editingTitleId}
                        setEditingTitleId={setEditingTitleId}
                        handleQuickUpdate={handleQuickUpdate}
                        deleteItem={deleteItem}
                        editingItem={editingItem}
                        editingMissionTitleId={editingMissionTitleId}
                        setEditingMissionTitleId={setEditingMissionTitleId}
                        activeMissionId={activeMissionId}
                        setActiveMissionId={setActiveMissionId}
                        handleMissionReorder={handleMissionReorder}
                        handleStepReorder={handleStepReorder}
                        startEditing={startEditing}
                        saveEditing={saveEditing}
                        cancelEditing={cancelEditing}
                        setEditingItem={setEditingItem}
                        newStep={newStep}
                        setNewStep={setNewStep}
                        createStep={createStep}
                        creatingMissionInLevelId={creatingMissionInLevelId}
                        setCreatingMissionInLevelId={setCreatingMissionInLevelId}
                        newMission={newMission}
                        setNewMission={setNewMission}
                        createMission={createMission}
                        setShowLevelModal={setShowLevelModal}
                        showToast={showToast}
                    />
                )}
            </main>

            {/* CREATION MODAL */}
            <AdminCreationModal
                creationModal={creationModal}
                setCreationModal={setCreationModal}
                handleCreateSubmit={handleCreateSubmit}
                isSavingUnit={isSavingUnit}
            />

            {/* EDIT UNIT MODAL */}
            <AdminEditUnitModal
                editingUnit={editingUnit}
                setEditingUnit={setEditingUnit}
                fileInputRef={fileInputRef}
                handleImageChange={handleImageChange}
                saveUnitChanges={saveUnitChanges}
                isSavingUnit={isSavingUnit}
            />

            {/* LEVEL CREATION MODAL */}
            <AdminLevelCreationModal
                showLevelModal={showLevelModal}
                setShowLevelModal={setShowLevelModal}
                newLevelData={newLevelData}
                setNewLevelData={setNewLevelData}
                createLevel={createLevel}
            />

        </div >
    );
};

export default AdminDashboard;
