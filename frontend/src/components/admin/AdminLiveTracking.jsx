import React, { useEffect, useState } from 'react';
import { Search, User, RefreshCw, ChevronDown, ChevronUp, Calendar as CalendarIcon, ChevronRight, ChevronLeft, UserPlus, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addDays, subDays } from 'date-fns';
import { he } from 'date-fns/locale';
import ScheduleTimeline from '../ScheduleTimeline';
import Lightbox from '../Lightbox';

const AdminLiveTracking = ({ activeUnitId, contentTree, showToast }) => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [guests, setGuests] = useState([]); // All unit guests (for selection)
    const [assignment, setAssignment] = useState(null); // The assigned user for selectedDate
    const [activeUserProgress, setActiveUserProgress] = useState({ steps: new Set(), missions: new Set() });

    const [loading, setLoading] = useState(true);
    const [assigningStr, setAssigningStr] = useState(false); // Loading state for assignment action
    const [lightboxSrc, setLightboxSrc] = useState(null);
    const [filterQuery, setFilterQuery] = useState('');

    // Fetch initial data (Users)
    useEffect(() => {
        if (activeUnitId) fetchUsers();
    }, [activeUnitId]);

    // Fetch Assignment & Progress whenever Date or Unit changes
    useEffect(() => {
        if (activeUnitId) fetchAssignmentAndProgress();

        // Poll for progress updates if we have an assignment (live tracking)
        const interval = setInterval(() => {
            if (assignment && activeUnitId) refreshProgressOnly();
        }, 5000); // 5 seconds poll
        return () => clearInterval(interval);
    }, [activeUnitId, selectedDate, assignment?.id]);

    const fetchUsers = async () => {
        try {
            const usersRes = await fetch('/api/admin/users');
            const allUsers = await usersRes.json();
            const unitUsers = allUsers.filter(u => u.unit_id === activeUnitId && u.status === 'approved');
            setGuests(unitUsers);
        } catch (err) {
            console.error("Failed to fetch users", err);
        }
    };

    const fetchAssignmentAndProgress = async () => {
        setLoading(true);
        try {
            const formattedDate = format(selectedDate, 'yyyy-MM-dd');
            const res = await fetch(`/api/assignments?unit_id=${activeUnitId}&start=${formattedDate}&end=${formattedDate}`);
            const assignments = await res.json();

            if (assignments.length > 0) {
                const assignedUser = assignments[0];
                setAssignment(assignedUser);
                await fetchProgress(assignedUser.guest_id);
            } else {
                setAssignment(null);
                setActiveUserProgress({ steps: new Set(), missions: new Set() });
            }
        } catch (err) {
            console.error("Fetch Assignment Error", err);
            showToast("שגיאה בטעינת תורן", "error");
        } finally {
            setLoading(false);
        }
    };

    const refreshProgressOnly = async () => {
        if (!assignment) return;
        await fetchProgress(assignment.guest_id);
    };

    const fetchProgress = async (guestId) => {
        try {
            const pRes = await fetch(`/api/progress/${guestId}`);
            const pData = await pRes.json();

            const completedSteps = new Set();
            const completedMissions = new Set();

            if (Array.isArray(pData)) {
                pData.forEach(id => completedSteps.add(id));
            } else {
                if (pData.steps) pData.steps.forEach(id => completedSteps.add(id));
                if (pData.missions) pData.missions.forEach(id => completedMissions.add(id));
            }
            setActiveUserProgress({ steps: completedSteps, missions: completedMissions });
        } catch (err) {
            console.error("Fetch Progress Error", err);
        }
    };

    const handleAssignUser = async (user) => {
        setAssigningStr(true);
        try {
            const formattedDate = format(selectedDate, 'yyyy-MM-dd');
            const res = await fetch('/api/assignments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    unit_id: activeUnitId,
                    guest_id: user.id,
                    date: formattedDate
                })
            });
            const data = await res.json();
            if (data.success) {
                showToast(`שובץ בהצלחה: ${user.first_name} ${user.last_name}`);
                fetchAssignmentAndProgress(); // Refresh
            } else {
                showToast("שגיאה בשיבוץ", "error");
            }
        } catch (err) {
            console.error(err);
            showToast("שגיאה בתקשורת", "error");
        } finally {
            setAssigningStr(false);
        }
    };

    // Calculate Stats
    const getProgressStats = () => {
        let totalItems = 0;
        let completedItems = 0;
        contentTree.forEach(level => {
            level.missions.forEach(mission => {
                if (mission.steps && mission.steps.length > 0) {
                    totalItems += mission.steps.length;
                    mission.steps.forEach(step => {
                        if (activeUserProgress.steps.has(step.id)) completedItems++;
                    });
                } else {
                    totalItems += 1;
                    if (activeUserProgress.missions.has(mission.id)) completedItems++;
                }
            });
        });
        const percentage = totalItems === 0 ? 0 : Math.round((completedItems / totalItems) * 100);
        return { percentage };
    };

    const toggleStepCompletion = async (e, stepId) => {
        e?.stopPropagation();
        if (!assignment) return;
        const guestId = assignment.guest_id;

        const isCompleted = !activeUserProgress.steps.has(stepId);
        // Optimistic
        const newSteps = new Set(activeUserProgress.steps);
        if (isCompleted) newSteps.add(stepId);
        else newSteps.delete(stepId);

        setActiveUserProgress(prev => ({ ...prev, steps: newSteps }));

        try {
            await fetch('/api/progress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    guest_id: guestId,
                    item_id: stepId,
                    item_type: 'step',
                    is_completed: isCompleted
                })
            });
        } catch (err) {
            console.error(err);
            refreshProgressOnly(); // Revert
        }
    };

    const toggleMissionCompletion = async (e, mission) => {
        e?.stopPropagation();
        if (!assignment) return;
        const guestId = assignment.guest_id;

        // No-step Mission
        if (!mission.steps || mission.steps.length === 0) {
            const isCompleted = !activeUserProgress.missions.has(mission.id);
            const newMissions = new Set(activeUserProgress.missions);
            if (isCompleted) newMissions.add(mission.id);
            else newMissions.delete(mission.id);

            setActiveUserProgress(prev => ({ ...prev, missions: newMissions }));

            await fetch('/api/progress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ guest_id: guestId, item_id: mission.id, item_type: 'mission', is_completed: isCompleted })
            });
            return;
        }

        // Stepped Mission (Batch Toggle)
        if (mission.steps && mission.steps.length > 0) {
            const isAllComplete = mission.steps.every(s => activeUserProgress.steps.has(s.id));
            const shouldComplete = !isAllComplete;

            const newSteps = new Set(activeUserProgress.steps);
            const updates = [];

            mission.steps.forEach(step => {
                const isStepCompleted = newSteps.has(step.id);
                if (shouldComplete && !isStepCompleted) {
                    newSteps.add(step.id);
                    updates.push({ id: step.id, done: true });
                } else if (!shouldComplete && isStepCompleted) {
                    newSteps.delete(step.id);
                    updates.push({ id: step.id, done: false });
                }
            });

            setActiveUserProgress(prev => ({ ...prev, steps: newSteps }));
            try {
                await Promise.all(updates.map(u =>
                    fetch('/api/progress', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ guest_id: guestId, item_id: u.id, item_type: 'step', is_completed: u.done })
                    })
                ));
            } catch (err) {
                console.error(err);
                refreshProgressOnly();
            }
        }
    };


    const { percentage } = getProgressStats();

    return (
        <div className="animate-fade-in w-full h-full flex flex-col">

            {/* 1. Header & Calendar Strip */}
            <div className="glass-card mb-6 p-4 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <button onClick={() => setSelectedDate(subDays(selectedDate, 1))} className="btn-icon">
                        <ChevronRight size={24} />
                    </button>

                    <div className="flex items-center gap-3">
                        <CalendarIcon size={24} className="text-[var(--accent-color)]" />
                        <h2 className="text-2xl font-bold m-0 text-[var(--text-primary)]">
                            {format(selectedDate, 'EEEE, d MMMM', { locale: he })}
                        </h2>
                    </div>

                    <button onClick={() => setSelectedDate(addDays(selectedDate, 1))} className="btn-icon">
                        <ChevronLeft size={24} />
                    </button>
                </div>
            </div>

            {/* 2. Main Content Area */}
            <div className="flex-1 relative min-h-[400px]">
                {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="loader"></div>
                    </div>
                ) : assignment ? (
                    /* VIEW: Assigned User Tracking */
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col gap-6"
                    >
                        {/* User Card */}
                        <div className="glass-card p-6 flex flex-col md:flex-row items-center gap-8 justify-between bg-gradient-to-r from-[rgba(255,255,255,0.03)] to-[rgba(255,255,255,0.06)]">

                            <div className="flex items-center gap-6">
                                {/* Large Avatar */}
                                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-3xl shadow-xl ring-4 ring-[var(--bg-primary)]">
                                    {assignment.first_name[0]}
                                </div>

                                <div>
                                    <div className="flex items-center gap-2 opacity-70 mb-1">
                                        <ShieldAlert size={16} />
                                        <span className="text-sm font-semibold tracking-wider uppercase">תורן יומי</span>
                                    </div>
                                    <h1 className="text-4xl font-extrabold m-0 text-transparent bg-clip-text bg-gradient-to-l from-white to-[var(--accent-color)]">
                                        {assignment.first_name} {assignment.last_name}
                                    </h1>
                                    <p className="opacity-60 mt-2 text-lg">
                                        סטטוס: <span className="text-[var(--success-color)]">פעיל</span>
                                    </p>
                                </div>
                            </div>

                            {/* Big Progress Ring */}
                            <div className="flex items-center gap-6">
                                <div className="text-left hidden md:block">
                                    <div className="text-3xl font-bold">{percentage}%</div>
                                    <div className="text-sm opacity-50">הושלם</div>
                                </div>
                                <div style={{ width: '100px', height: '100px' }} className="relative flex items-center justify-center">
                                    <svg width="100" height="100" viewBox="0 0 100 100" className="transform -rotate-90">
                                        <circle cx="50" cy="50" r="42" stroke="rgba(255,255,255,0.1)" strokeWidth="8" fill="none" />
                                        <circle cx="50" cy="50" r="42" stroke="var(--accent-color)" strokeWidth="8" fill="none"
                                            strokeDasharray="263.89"
                                            strokeDashoffset={263.89 - (263.89 * percentage) / 100}
                                            style={{ transition: 'stroke-dashoffset 1s ease-out', strokeLinecap: 'round' }}
                                        />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Timeline */}
                        <div className="glass-card p-6 md:p-10">
                            <h3 className="text-xl font-bold mb-8 flex items-center gap-3 border-b border-[var(--glass-border)] pb-4">
                                <RefreshCw size={20} className="animate-spin-slow opacity-50" />
                                מעקב ביצוע בזמן אמת
                            </h3>
                            <div style={{ direction: "rtl" }}>
                                <ScheduleTimeline
                                    schedule={contentTree}
                                    completedSteps={activeUserProgress.steps}
                                    completedMissions={activeUserProgress.missions}
                                    toggleCompletion={toggleStepCompletion}
                                    toggleMissionCompletion={toggleMissionCompletion}
                                    onImageClick={(img) => setLightboxSrc({ src: img, type: 'image' })}
                                    readOnly={false} // Admin allows edit
                                />
                            </div>
                        </div>

                    </motion.div>
                ) : (
                    /* VIEW: Unassigned / Selection */
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center min-h-[400px] text-center"
                    >
                        <div className="w-24 h-24 rounded-full bg-[rgba(255,255,255,0.05)] flex items-center justify-center mb-6">
                            <UserPlus size={48} className="opacity-40" />
                        </div>
                        <h2 className="text-3xl font-bold mb-2">אין תורן משובץ ליום זה</h2>
                        <p className="opacity-60 mb-8 max-w-md">
                            בחר חייל מהרשימה כדי לשבץ אותו כתורן ליום {format(selectedDate, 'EEEE, d MMMM', { locale: he })}.
                        </p>

                        <div className="w-full max-w-4xl">
                            {/* Search */}
                            <div className="relative mb-6 max-w-md mx-auto">
                                <Search className="absolute top-3 right-3 opacity-50" size={18} />
                                <input
                                    className="input-modern w-full pr-10"
                                    placeholder="חפש חייל לשיבוץ..."
                                    value={filterQuery}
                                    onChange={e => setFilterQuery(e.target.value)}
                                />
                            </div>

                            {/* Users Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-right" style={{ direction: 'rtl' }}>
                                {guests.filter(g => (g.first_name + ' ' + g.last_name).includes(filterQuery)).map(guest => (
                                    <div
                                        key={guest.id}
                                        onClick={() => !assigningStr && handleAssignUser(guest)}
                                        className="glass-card p-4 flex items-center gap-4 cursor-pointer hover:bg-[rgba(255,255,255,0.05)] transition-all border border-transparent hover:border-[var(--accent-color)] group"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center font-bold">
                                            {guest.first_name[0]}
                                        </div>
                                        <div>
                                            <div className="font-bold group-hover:text-[var(--accent-color)] transition-colors">
                                                {guest.first_name} {guest.last_name}
                                            </div>
                                            <div className="text-xs opacity-50">לחץ לשיבוץ</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>

            {lightboxSrc && <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}
        </div>
    );
};

export default AdminLiveTracking;
