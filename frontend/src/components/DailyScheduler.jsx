import React, { useEffect, useState, useRef } from 'react';
import { Clock, CheckCircle, Circle, ChevronDown, ChevronUp, Search, User, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Confetti from 'react-confetti';
import { Toaster, toast } from 'sonner';
import Lightbox from './Lightbox';
import ScheduleTimeline from './ScheduleTimeline';

const DailyScheduler = () => {
    const [schedule, setSchedule] = useState([]);
    const [completedSteps, setCompletedSteps] = useState(new Set());
    const [completedMissions, setCompletedMissions] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [guestStatus, setGuestStatus] = useState(null);
    const [guestData, setGuestData] = useState(null);

    // Authorization & Assignment State
    const [assignmentState, setAssignmentState] = useState({ has_assignment: null, is_me: false, assigned_to: null });

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedUnit, setSelectedUnit] = useState(null);
    const [showConfetti, setShowConfetti] = useState(false);
    const prevProgressRef = useRef(0);
    const [lightboxSrc, setLightboxSrc] = useState(null);
    const navigate = useNavigate();

    // 1. Fetch Schedule & Assignment Data
    const fetchScheduleData = async (guestId) => {
        try {
            const schedRes = await fetch(`/api/schedule/today?guest_id=${guestId}`);
            const schedData = await schedRes.json();

            if (!schedData.has_assignment) {
                setAssignmentState({ has_assignment: false, is_me: false, assigned_to: null });
                return;
            }

            setAssignmentState({
                has_assignment: true,
                is_me: schedData.is_me,
                assigned_to: schedData.assigned_to
            });
            setSchedule(schedData.schedule);

            // Fetch Progress (for the ASSIGNED user)
            const targetUserId = schedData.assigned_to.id;
            const progRes = await fetch(`/api/progress/${targetUserId}`);
            const progData = await progRes.json();

            const completedSet = new Set();
            if (Array.isArray(progData)) {
                progData.forEach(id => completedSet.add(id));
            } else {
                if (progData.steps) progData.steps.forEach(id => completedSet.add(id));
                const missionSet = new Set();
                if (progData.missions) progData.missions.forEach(id => missionSet.add(id));
                setCompletedMissions(missionSet);
            }
            setCompletedSteps(completedSet);
        } catch (err) {
            console.error("Failed to load schedule", err);
        }
    };

    useEffect(() => {
        const guestId = localStorage.getItem('guest_id');
        if (!guestId) {
            navigate('/');
            return;
        }

        const initFetch = async () => {
            try {
                // Fetch Guest Details
                const guestRes = await fetch(`/api/guests/${guestId}`);
                if (guestRes.ok) {
                    const data = await guestRes.json();
                    setGuestStatus(data.status || 'pending_unit_selection');
                    setGuestData(data);

                    if (data.status === 'approved') {
                        await fetchScheduleData(guestId);
                    }
                }
                setLoading(false);
            } catch (err) {
                console.error("Init fetch failed", err);
                setLoading(false);
            }
        };
        initFetch();

        // POLLING: Refresh progress every 5 seconds (Only if approved and assigned)
        const interval = setInterval(() => {
            if (guestStatus === 'approved') {
                fetchScheduleData(guestId);
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [navigate, guestStatus]);

    // Search Units
    useEffect(() => {
        if (searchQuery.length < 2) {
            setSearchResults([]);
            return;
        }
        const timer = setTimeout(async () => {
            try {
                const res = await fetch(`/api/units/search?q=${searchQuery}`);
                const data = await res.json();
                setSearchResults(data);
            } catch (err) {
                console.error("Search failed", err);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Calculate Progress
    const totalSteps = schedule.reduce((acc, level) => {
        return acc + (level.missions?.reduce((mAcc, mission) => {
            return mAcc + (mission.steps && mission.steps.length > 0 ? mission.steps.length : 1);
        }, 0) || 0);
    }, 0);

    const completedCount = completedSteps.size + completedMissions.size;
    const progress = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;

    // Trigger confetti on 100% completion
    useEffect(() => {
        if (progress === 100 && prevProgressRef.current < 100) {
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 5000);
        }
        prevProgressRef.current = progress;
    }, [progress]);

    const handleJoinRequest = async () => {
        if (!selectedUnit) return;
        const guestId = localStorage.getItem('guest_id');
        try {
            await fetch('/api/guests/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ guest_id: guestId, unit_id: selectedUnit.id })
            });
            setGuestStatus('pending_approval');
            setSelectedUnit(null);
        } catch (err) {
            console.error("Join request failed", err);
            toast.error("שגיאה בשליחת הבקשה"); // Also updated this alert
        }
    };

    const toggleCompletion = async (e, stepId) => {
        e.stopPropagation();
        if (!assignmentState.has_assignment) return;

        // Viewer Mode Check
        if (!assignmentState.is_me) {
            toast.error(`רק ${assignmentState.assigned_to?.name} יכול לסמן משימות!`);
            return;
        }

        const guestId = localStorage.getItem('guest_id');
        const isCompleted = !completedSteps.has(stepId);

        // Optimistic UI Update
        const newCompleted = new Set(completedSteps);
        if (isCompleted) newCompleted.add(stepId);
        else newCompleted.delete(stepId);
        setCompletedSteps(newCompleted);

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
            console.error("Failed to save progress", err);
        }
    };

    const toggleMissionCompletion = async (e, mission) => {
        e.stopPropagation();
        if (!assignmentState.is_me) {
            toast.error(`רק ${assignmentState.assigned_to?.name} יכול לסמן משימות!`);
            return;
        }

        const guestId = localStorage.getItem('guest_id');

        // CASE 1: Mission has NO steps -> Toggle Mission Progress directly
        if (!mission.steps || mission.steps.length === 0) {
            const isCompleted = !completedMissions.has(mission.id);

            // Optimistic Update
            const newMissions = new Set(completedMissions);
            if (isCompleted) newMissions.add(mission.id);
            else newMissions.delete(mission.id);
            setCompletedMissions(newMissions);

            try {
                await fetch('/api/progress', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        guest_id: guestId,
                        item_id: mission.id,
                        item_type: 'mission',
                        is_completed: isCompleted
                    })
                });
            } catch (err) {
                console.error("Failed to update mission progress", err);
            }
            return;
        }

        // CASE 2: Mission HAS steps -> Toggle all steps
        if (mission.steps && mission.steps.length > 0) {
            const isAllComplete = mission.steps.every(s => completedSteps.has(s.id));
            const shouldComplete = !isAllComplete;

            const newCompleted = new Set(completedSteps);
            const updates = [];

            mission.steps.forEach(step => {
                const isStepCompleted = completedSteps.has(step.id);
                if (shouldComplete && !isStepCompleted) {
                    newCompleted.add(step.id);
                    updates.push({ id: step.id, done: true });
                } else if (!shouldComplete && isStepCompleted) {
                    newCompleted.delete(step.id);
                    updates.push({ id: step.id, done: false });
                }
            });

            setCompletedSteps(newCompleted);

            try {
                await Promise.all(updates.map(u =>
                    fetch('/api/progress', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            guest_id: guestId,
                            item_id: u.id,
                            item_type: 'step',
                            is_completed: u.done
                        })
                    })
                ));
            } catch (err) {
                console.error("Failed to batch update", err);
            }
        }
    };

    const getMotivationalText = (p) => {
        if (p === 0) return "מוכן ליציאה? 🚀";
        if (p < 25) return "מנועים הופעלו... 🔥";
        if (p < 50) return "קצב אש! להמשיך! 💪";
        if (p < 75) return "חצי דרך בפנים! לא לעצור! 🛡️";
        if (p < 100) return "פיניש קטן וזהו! 🏁";
        const firstName = guestData?.first_name || 'חייל';
        return `${firstName}, המשימה הושלמה! כל הכבוד! 🏆`;
    };

    if (loading) return <div className="container" style={{ textAlign: 'center', marginTop: '50px' }}>טוען נתונים...</div>;


    // --- RENDER: PLOGA SELECTION ---
    if (guestStatus === 'pending_unit_selection') {
        return (
            <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '60px' }}>
                <Toaster richColors position="top-center" />
                <div className="glass-card" style={{ maxWidth: '400px', width: '100%', textAlign: 'center', padding: '32px' }}>
                    <Shield size={48} color="var(--accent-color)" style={{ marginBottom: '16px' }} />
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>לאיזו גדוד אתה שייך?</h2>
                    <p style={{ opacity: 0.7, marginBottom: '24px' }}>חפש את הגדוד שלך כדי להצטרף</p>
                    <div style={{ position: 'relative', marginBottom: '16px' }}>
                        <Search size={18} style={{ position: 'absolute', top: '12px', right: '12px', opacity: 0.5 }} />
                        <input
                            type="text" placeholder="חפש גדוד (למשל: נחשון)"
                            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                            style={{ paddingRight: '40px', width: '100%' }} autoFocus
                        />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                        {searchResults.map(unit => (
                            <div key={unit.id} onClick={() => setSelectedUnit(unit)} style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }} className="hover-scale">
                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--glass-border)' }}>
                                    {unit.image_url && <img src={unit.image_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />}
                                </div>
                                <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{unit.title}</span>
                            </div>
                        ))}
                    </div>
                </div>
                {selectedUnit && (
                    <div style={{ position: 'fixed', top: 0, bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div className="glass-card" style={{ maxWidth: '320px', padding: '32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            {selectedUnit.image_url && (
                                <img
                                    src={selectedUnit.image_url}
                                    alt={selectedUnit.title}
                                    style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', marginBottom: '16px', border: '2px solid var(--accent-color)' }}
                                />
                            )}
                            <h3 style={{ lineHeight: '1.4' }}>
                                האם להצטרף ל-<br />
                                <span style={{ fontSize: '1.4rem', color: 'var(--accent-color)' }}>{selectedUnit.title}</span>?
                            </h3>
                            <p style={{ opacity: 0.8, marginTop: '8px' }}>בקשתך תישלח לאישור מנהל.</p>
                            <button className="btn-primary" onClick={handleJoinRequest} style={{ marginTop: '16px', width: '100%' }}>כן, שלח בקשה</button>
                            <button className="btn-secondary" onClick={() => setSelectedUnit(null)} style={{ marginTop: '8px' }}>ביטול</button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // --- RENDER: PENDING APPROVAL ---
    if (guestStatus === 'pending_approval' || guestStatus === 'pending') {
        return (
            <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh', textAlign: 'center' }}>
                <div className="glass-card" style={{ padding: '40px' }}>
                    <CheckCircle size={48} color="#2ecc71" style={{ marginBottom: '16px' }} />
                    <h2>בקשתך נשלחה!</h2>
                    <p>אנא המתן לאישור מנהל.</p>
                    <button className="btn-secondary" onClick={() => window.location.reload()} style={{ marginTop: '16px' }}>רענן</button>
                </div>
            </div>
        );
    }

    if (guestStatus === 'rejected') {
        return <div className="container" style={{ textAlign: 'center', marginTop: '50px' }}><h2>בקשתך נדחתה</h2><button className="btn-primary" onClick={() => setGuestStatus('pending_unit_selection')}>נסה שוב</button></div>;
    }

    // --- RENDER: NO ASSIGNMENT ---
    if (assignmentState.has_assignment === false) {
        return (
            <div className="container" style={{ textAlign: 'center', marginTop: '100px' }}>
                <div className="glass-card" style={{ padding: '40px' }}>
                    <Shield size={48} color="var(--accent-color)" style={{ marginBottom: '16px', opacity: 0.5 }} />
                    <h2>אין משימות להיום</h2>
                    <p>הפלוגה שלך לא שובצה למשימות היום.</p>
                </div>
            </div>
        );
    }

    // --- RENDER: SCHEDULE ---
    return (
        <div className="container" style={{ paddingBottom: '100px' }}>
            {showConfetti && <Confetti width={window.innerWidth} height={window.innerHeight} recycle={false} numberOfPieces={300} />}

            {/* VIEWER MODE BANNER */}
            {!assignmentState.is_me && assignmentState.assigned_to && (
                <div style={{
                    background: 'rgba(234, 179, 8, 0.15)', // Amber tint
                    color: '#facc15', // Bright Yellow/Amber text
                    padding: '12px',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    border: '1px solid rgba(234, 179, 8, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                }}>
                    <span>👁️</span>
                    <span>הנך צופה בהתקדמות של - {assignmentState.assigned_to.name}</span>
                </div>
            )}

            <header style={{ marginBottom: '24px', display: 'grid', gridTemplateColumns: '80px 1fr 80px', direction: 'rtl' }}>
                <div style={{ justifySelf: 'start' }}><img src="/Logo-Bright.png" alt="Logo" className="theme-logo" style={{ width: '68px', height: '68px', objectFit: 'contain' }} /></div>
                <div style={{ textAlign: 'center' }}>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: '800', margin: 0 }}>לו"ז יומי</h2>
                    {assignmentState.assigned_to && <span style={{ opacity: 0.7 }}>{assignmentState.assigned_to.name}</span>}
                    <div style={{ fontSize: '0.85rem', opacity: 0.5 }}>{format(new Date(), 'dd/MM/yyyy')}</div>
                </div>
                <div style={{ justifySelf: 'end' }}>
                    {guestData && guestData.unit_image && <img src={guestData.unit_image} style={{ width: '56px', height: '56px', borderRadius: '50%' }} />}
                </div>
            </header>

            <ScheduleTimeline
                schedule={schedule}
                completedSteps={completedSteps}
                completedMissions={completedMissions}
                toggleCompletion={toggleCompletion}
                toggleMissionCompletion={toggleMissionCompletion}
                onImageClick={(img) => setLightboxSrc({ src: img, type: 'image' })}
            />

            {/* Sticky Progress Bar */}
            {totalSteps > 0 && (
                <div style={{ position: 'fixed', bottom: '20px', left: '20px', right: '20px', zIndex: 100 }}>
                    <div className="glass-card" style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid var(--accent-color)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 'bold', color: 'var(--accent-color)' }}>{getMotivationalText(progress)}</span>
                            <span style={{ fontWeight: 'bold' }}>{progress}%</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                style={{ height: '100%', background: 'var(--accent-color)' }}
                            />
                        </div>
                    </div>
                </div>
            )}

            <Lightbox isOpen={!!lightboxSrc} src={lightboxSrc?.src} onClose={() => setLightboxSrc(null)} />
        </div>
    );
};

export default DailyScheduler;
