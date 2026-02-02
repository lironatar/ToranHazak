const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const db = require('./database');
const fs = require('fs');

const app = express();

// Middleware (MUST be before routes)
app.use(cors());
app.use(express.json({ limit: '10mb' }));
// Serve uploaded files statically (optional if saving to frontend/public)
app.use('/uploads', express.static(path.join(__dirname, '../frontend/public/uploads')));

// Reorder Missions
app.post('/api/missions/reorder', (req, res) => {
    const { updates } = req.body; // Array of { id, display_order }
    if (!updates || !Array.isArray(updates)) return res.status(400).json({ error: "Invalid updates format" });

    db.serialize(() => {
        const stmt = db.prepare("UPDATE missions SET display_order = ? WHERE id = ?");
        updates.forEach(u => stmt.run(u.display_order, u.id));
        stmt.finalize((err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
    });
});

// Reorder Steps
app.post('/api/steps/reorder', (req, res) => {
    const { updates } = req.body;
    if (!updates || !Array.isArray(updates)) return res.status(400).json({ error: "Invalid updates format" });

    db.serialize(() => {
        const stmt = db.prepare("UPDATE steps SET display_order = ? WHERE id = ?");
        updates.forEach(u => stmt.run(u.display_order, u.id));
        stmt.finalize((err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
    });
});

// Upload Image (Base64)
app.post('/api/upload', (req, res) => {
    console.log(`[UPLOAD] Request received from ${req.ip}`);
    try {
        const { image, filename } = req.body;
        if (!image || !filename) {
            console.error("[UPLOAD] Missing image or filename");
            return res.status(400).json({ error: "Missing image data" });
        }

        // Decode base64
        const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
            console.error("[UPLOAD] Invalid base64 format");
            return res.status(400).json({ error: "Invalid base64 string" });
        }

        const type = matches[1];
        const buffer = Buffer.from(matches[2], 'base64');

        // Secure filename (timestamp + random)
        const ext = path.extname(filename) || '.png'; // Default to png if missing
        const safeName = `${Date.now()}-${Math.floor(Math.random() * 1000)}${ext}`;
        // SAVE TO FRONTEND PUBLIC FOLDER
        const uploadDir = path.join(__dirname, '../frontend/public/uploads');
        if (!fs.existsSync(uploadDir)) {
            console.log(`[UPLOAD] Creating directory: ${uploadDir}`);
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const filePath = path.join(uploadDir, safeName);
        console.log(`[UPLOAD] Saving file to: ${filePath}`);

        fs.writeFile(filePath, buffer, (err) => {
            if (err) {
                console.error(`[UPLOAD] Write Error: ${err.message}`);
                return res.status(500).json({ error: err.message });
            }

            console.log(`[UPLOAD] Success: /uploads/${safeName}`);
            // Return public URL
            res.json({ url: `/uploads/${safeName}` });
        });
    } catch (e) {
        console.error(`[UPLOAD] Exception: ${e.message}`);
        res.status(500).json({ error: "Upload failed" });
    }
});

const PORT = 5000;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// ----------------------
// DATABASE INIT
// ----------------------
db.serialize(() => {
    // Tables
    db.run(`CREATE TABLE IF NOT EXISTS profiles (id INTEGER PRIMARY KEY, title TEXT, description TEXT)`);
    db.run(`CREATE TABLE IF NOT EXISTS levels (id INTEGER PRIMARY KEY, title TEXT, profile_id INTEGER, display_order INTEGER)`);


    // MISSION now has target_time
    db.run(`CREATE TABLE IF NOT EXISTS missions (
        id INTEGER PRIMARY KEY, 
        level_id INTEGER, 
        title TEXT, 
        description TEXT, 
        image_url TEXT,
        target_time TEXT,
        display_order INTEGER
    )`);

    // Migration: Ensure target_time exists (for old databases)
    db.run("ALTER TABLE missions ADD COLUMN target_time TEXT", (err) => {
        // Ignore error if column already exists
    });

    // STEPS
    db.run(`CREATE TABLE IF NOT EXISTS steps (
        id INTEGER PRIMARY KEY, 
        mission_id INTEGER, 
        title TEXT, 
        subtitle TEXT, 
        description TEXT, 
        target_time TEXT, 
        image_url TEXT,
        display_order INTEGER
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS guests (id INTEGER PRIMARY KEY, first_name TEXT, last_name TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);

    // Guests Table Migration
    db.serialize(() => {
        db.all("PRAGMA table_info(guests)", (err, cols) => {
            if (err) { console.error("Guest migration check failed", err); return; }

            if (!cols.some(c => c.name === 'unit_id')) {
                console.log("Migrating guests: Adding unit_id");
                db.run("ALTER TABLE guests ADD COLUMN unit_id INTEGER");
            }
            if (!cols.some(c => c.name === 'status')) {
                console.log("Migrating guests: Adding status");
                db.run("ALTER TABLE guests ADD COLUMN status TEXT DEFAULT 'pending_unit_selection'");
            }
            if (!cols.some(c => c.name === 'active_profile_id')) {
                console.log("Migrating guests: Adding active_profile_id");
                db.run("ALTER TABLE guests ADD COLUMN active_profile_id INTEGER");
            }
            if (!cols.some(c => c.name === 'profile_id')) {
                console.log("Migrating guests: Adding profile_id");
                db.run("ALTER TABLE guests ADD COLUMN profile_id INTEGER");
            }

            // Force update for existing users without profile
            db.run("UPDATE guests SET active_profile_id = 1, unit_id = 1, profile_id = 1 WHERE active_profile_id IS NULL");
        });
    });

    // PROGRESS TABLE MIGRATION (Adding completion_date)
    db.serialize(() => {
        // Check if progress table has completion_date
        db.all("PRAGMA table_info(progress)", (err, cols) => {
            if (!cols.some(c => c.name === 'completion_date')) {
                console.log("Migrating progress table...");
                db.run("ALTER TABLE progress RENAME TO old_progress");
                db.run(`CREATE TABLE IF NOT EXISTS progress (
                    guest_id INTEGER, 
                    step_id INTEGER, 
                    completion_date TEXT, -- YYYY-MM-DD
                    completed BOOLEAN, 
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, 
                    PRIMARY KEY (guest_id, step_id, completion_date)
                )`);
                // Attempt to copy old data (defaulting to today or timestamp date)
                db.run(`INSERT INTO progress (guest_id, step_id, completion_date, completed, timestamp) 
                        SELECT guest_id, step_id, date(timestamp), completed, timestamp FROM old_progress`);
                db.run("DROP TABLE old_progress");
            }
        });

        // Check mission_progress table
        db.all("PRAGMA table_info(mission_progress)", (err, cols) => {
            if (!cols.some(c => c.name === 'completion_date')) {
                console.log("Migrating mission_progress table...");
                db.run("ALTER TABLE mission_progress RENAME TO old_mission_progress");
                db.run(`CREATE TABLE IF NOT EXISTS mission_progress (
                    guest_id INTEGER, 
                    mission_id INTEGER, 
                    completion_date TEXT, 
                    completed BOOLEAN, 
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, 
                    PRIMARY KEY (guest_id, mission_id, completion_date)
                )`);
                db.run(`INSERT INTO mission_progress (guest_id, mission_id, completion_date, completed, timestamp) 
                        SELECT guest_id, mission_id, date(timestamp), completed, timestamp FROM old_mission_progress`);
                db.run("DROP TABLE old_mission_progress");
            }
        });
    });

    // Assignments Table
    db.run(`CREATE TABLE IF NOT EXISTS assignments (
        id INTEGER PRIMARY KEY,
        unit_id INTEGER,
        guest_id INTEGER,
        assignment_date TEXT, -- YYYY-MM-DD
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(unit_id, assignment_date)
    )`);
});

// ----------------------
// ADMIN ROUTES (Simple Auth)
// ----------------------
const ADMIN_ID = "admin";
const ADMIN_PASS = "Admin!1ADMIN";

app.post('/api/admin/login', (req, res) => {
    const { id, password } = req.body;
    if (id === ADMIN_ID && password === ADMIN_PASS) {
        res.json({ success: true, token: "admin-token-secret" });
    } else {
        res.status(401).json({ success: false, message: "Invalid credentials" });
    }
});

// --- ASSIGNMENTS ---

// Get Assignments for Unit
app.get('/api/assignments', (req, res) => {
    const { unit_id, start, end } = req.query;
    if (!unit_id) return res.status(400).json({ error: "Missing unit_id" });

    let sql = `
        SELECT a.*, g.first_name, g.last_name, g.status, g.unit_id as guest_unit_id, g.active_profile_id, g.profile_id
        FROM assignments a
        JOIN guests g ON a.guest_id = g.id
        WHERE a.unit_id = ?
    `;
    const params = [unit_id];

    if (start && end) {
        sql += " AND a.assignment_date BETWEEN ? AND ?";
        params.push(start, end);
    }

    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        // Enhance with Progress
        if (rows.length === 0) return res.json([]);

        const guestIds = [...new Set(rows.map(r => r.guest_id))];
        const minDate = start || rows.reduce((min, r) => r.assignment_date < min ? r.assignment_date : min, rows[0].assignment_date);
        const maxDate = end || rows.reduce((max, r) => r.assignment_date > max ? r.assignment_date : max, rows[0].assignment_date);

        const sqlProgress = `
            SELECT guest_id, completion_date, count(*) as completed_count 
            FROM progress 
            WHERE guest_id IN (${guestIds.join(',')}) 
            AND completion_date BETWEEN ? AND ?
            GROUP BY guest_id, completion_date
        `;

        const sqlMissionProgress = `
            SELECT guest_id, completion_date, count(*) as completed_count 
            FROM mission_progress 
            WHERE guest_id IN (${guestIds.join(',')}) 
            AND completion_date BETWEEN ? AND ?
            GROUP BY guest_id, completion_date
        `;

        db.all(sqlProgress, [minDate, maxDate], (err, pRows) => {
            if (err) console.error("Progress fetch error", err); // Continue

            db.all(sqlMissionProgress, [minDate, maxDate], (err, mpRows) => {
                if (err) console.error("Mission Progress fetch error", err);

                const result = rows.map(r => {
                    const p = pRows?.find(x => x.guest_id === r.guest_id && x.completion_date === r.assignment_date);
                    const mp = mpRows?.find(x => x.guest_id === r.guest_id && x.completion_date === r.assignment_date);
                    return {
                        ...r,
                        completed_steps: p ? p.completed_count : 0,
                        completed_missions: mp ? mp.completed_count : 0
                    };
                });
                res.json(result);
            });
        });
    });
});

// Assign User to Date
app.post('/api/assignments', (req, res) => {
    const { unit_id, guest_id, date } = req.body;

    // Check if assignment exists
    db.get("SELECT id FROM assignments WHERE unit_id = ? AND assignment_date = ?", [unit_id, date], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });

        if (row) {
            // Update
            db.run("UPDATE assignments SET guest_id = ? WHERE id = ?", [guest_id, row.id], (err) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ success: true });
            });
        } else {
            // Insert
            db.run("INSERT INTO assignments (unit_id, guest_id, assignment_date) VALUES (?, ?, ?)", [unit_id, guest_id, date], function (err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ success: true, id: this.lastID });
            });
        }
    });
});

// Clear Assignment
app.delete('/api/assignments', (req, res) => {
    const { unit_id, date } = req.query;
    db.run("DELETE FROM assignments WHERE unit_id = ? AND assignment_date = ?", [unit_id, date], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});


// ----------------------
// PROFILES & ANALYTICS
// ----------------------

// ... (Keep existing GET/POST/PUT for Units/Profiles as they are) ...
// (Skipping for brevity in this tool call, will target specific blocks if needed, but here I am effectively replacing the DB init block and then will create a separate tool call for the routes if they are far apart, OR I can just replace the routes specifically).

// WAIT - I need to be careful with replace_file_content.
// I will split this into two calls. 
// 1. DB Init changes.
// 2. Route changes.


// ----------------------
// PROFILES & ANALYTICS
// ----------------------

// --- UNITS ---

app.get('/api/units', (req, res) => {
    db.all("SELECT * FROM units", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Search Units
app.get('/api/units/search', (req, res) => {
    const query = req.query.q;
    if (!query || query.length < 2) return res.json([]);

    db.all("SELECT * FROM units WHERE title LIKE ?", [`%${query}%`], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/units', (req, res) => {
    const { title, description, image_url } = req.body;
    db.run("INSERT INTO units (title, description, image_url) VALUES (?, ?, ?)", [title, description, image_url], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, title, description, image_url });
    });
});

app.put('/api/units/:id', (req, res) => {
    const { title, image_url } = req.body;
    const { id } = req.params;

    db.run("UPDATE units SET title = ?, image_url = ? WHERE id = ?", [title, image_url, id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// --- PROFILES ---

// Get Profiles (Optional filter by unit_id)
app.get('/api/profiles', (req, res) => {
    const unitId = req.query.unit_id;
    let sql = "SELECT * FROM profiles";
    let params = [];

    if (unitId) {
        sql += " WHERE unit_id = ?";
        params.push(unitId);
    }

    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Create Profile
app.post('/api/profiles', (req, res) => {
    const { title, description, unit_id, image_url } = req.body;
    const uid = unit_id || 1; // Default to unit 1 if missing
    db.run("INSERT INTO profiles (title, description, unit_id, image_url) VALUES (?, ?, ?, ?)", [title, description, uid, image_url], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, title, description, unit_id: uid, image_url });
    });
});

app.put('/api/profiles/:id', (req, res) => {
    const { title, description } = req.body;
    db.run("UPDATE profiles SET title = ?, description = ? WHERE id = ?", [title, description, req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ changes: this.changes });
    });
});

// Get Content for Profile
app.get('/api/profiles/:id/content', (req, res) => {
    const profileId = req.params.id;
    const pLevels = new Promise((resolve, reject) => {
        db.all("SELECT * FROM levels WHERE profile_id = ? ORDER BY id", [profileId], (err, rows) => err ? reject(err) : resolve(rows));
    });

    const pMissions = new Promise((resolve, reject) => {
        db.all(`SELECT m.* FROM missions m JOIN levels l ON m.level_id = l.id WHERE l.profile_id = ? ORDER BY m.target_time`, [profileId], (err, rows) => err ? reject(err) : resolve(rows));
    });
    const pSteps = new Promise((resolve, reject) => {
        db.all(`SELECT s.* FROM steps s JOIN missions m ON s.mission_id = m.id JOIN levels l ON m.level_id = l.id WHERE l.profile_id = ? ORDER BY s.display_order`, [profileId], (err, rows) => err ? reject(err) : resolve(rows));
    });

    Promise.all([pLevels, pMissions, pSteps]).then(([levels, missions, steps]) => {
        const content = levels.map(level => {
            const levelMissions = missions.filter(m => m.level_id === level.id).map(mission => {
                const missionSteps = steps.filter(s => s.mission_id === mission.id);
                return { ...mission, steps: missionSteps };
            });
            return { ...level, missions: levelMissions };
        });
        res.json(content);
    }).catch(err => res.status(500).json({ error: err.message }));
});


// Admin Stats & Requests
app.get('/api/admin/stats', (req, res) => {
    const pGuests = new Promise((resolve) => db.get("SELECT COUNT(*) as count FROM guests", (err, row) => resolve(row?.count || 0)));
    const pSteps = new Promise((resolve) => db.get("SELECT COUNT(*) as count FROM steps", (err, row) => resolve(row?.count || 0)));
    const pCompletions = new Promise((resolve) => db.get("SELECT COUNT(*) as count FROM progress", (err, row) => resolve(row?.count || 0)));

    // Ploga Distribution
    const pPlogaStats = new Promise((resolve) => {
        db.all("SELECT u.id, u.title, COUNT(g.id) as count FROM guests g JOIN units u ON g.unit_id = u.id WHERE g.status = 'approved' GROUP BY u.id, u.title", (err, rows) => resolve(rows || []));
    });

    Promise.all([pGuests, pSteps, pCompletions, pPlogaStats]).then(([guests, steps, completions, plogaStats]) => {
        res.json({ guests, steps, completions, plogaStats });
    });
});

// Get All Users (for People View)
app.get('/api/admin/users', (req, res) => {
    db.all(`
        SELECT g.*, u.title as unit_title, u.image_url as unit_image 
        FROM guests g 
        LEFT JOIN units u ON g.unit_id = u.id 
        ORDER BY g.status, u.title
    `, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Get Pending Requests
app.get('/api/admin/requests', (req, res) => {
    db.all(`
        SELECT g.*, u.title as unit_title, u.image_url as unit_image 
        FROM guests g 
        LEFT JOIN units u ON g.unit_id = u.id 
        WHERE g.status = 'pending_approval' OR g.status = 'pending'
    `, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Approve/Reject Request
app.post('/api/admin/requests/:id/:action', (req, res) => {
    const { id, action } = req.params; // action: 'approve' | 'reject'
    const status = action === 'approve' ? 'approved' : 'rejected';

    // If rejected, maybe we want to reset unit_id so they can try again? 
    // Or just mark as rejected. Let's mark as rejected.

    db.run("UPDATE guests SET status = ? WHERE id = ?", [status, id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, status });
    });
});


// ----------------------
// GUEST ROUTES
// ----------------------

// Register Guest
app.post('/api/guests', (req, res) => {
    let { first_name, last_name } = req.body;
    if (!first_name || !last_name) return res.status(400).json({ error: "Missing fields" });

    first_name = first_name.trim();
    last_name = last_name.trim();

    // Check if exists
    db.get("SELECT * FROM guests WHERE first_name = ? AND last_name = ?", [first_name, last_name], (err, row) => {
        if (row) {
            return res.json(row); // Return existing user including status/unit_id
        }

        // Create new
        const status = 'pending_unit_selection';
        db.run(`INSERT INTO guests (first_name, last_name, status) VALUES (?, ?, ?)`, [first_name, last_name, status], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, first_name, last_name, status });
        });
    });
});

// Check Guest Status
app.get('/api/guests/:id', (req, res) => {
    db.get(`
        SELECT g.*, u.title as unit_title, u.image_url as unit_image 
        FROM guests g 
        LEFT JOIN units u ON g.unit_id = u.id 
        WHERE g.id = ?
    `, [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: "Guest not found" });
        res.json(row);
    });
});

// Delete Guest
app.delete('/api/guests/:id', (req, res) => {
    db.run("DELETE FROM guests WHERE id = ?", [req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// Join Unit Request
app.post('/api/guests/join', (req, res) => {
    const { guest_id, unit_id } = req.body;
    db.run("UPDATE guests SET unit_id = ?, status = 'pending_approval' WHERE id = ?", [unit_id, guest_id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// Upload Image Endpoint
app.post('/api/upload', (req, res) => {
    const { image, filename } = req.body;
    if (!image || !filename) return res.status(400).json({ error: "Missing image or filename" });

    // Strip header (data:image/png;base64,)
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');

    const uniqueName = Date.now() + '-' + filename.replace(/\s+/g, '_');
    const uploadPath = path.join(__dirname, '../frontend/public/uploads', uniqueName);

    // Ensure directory exists (async check irrelevant if we assume create)
    // Actually, fs.writeFile will fail if dir doesn't exist.
    const dir = path.dirname(uploadPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFile(uploadPath, buffer, (err) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Failed to save file" });
        }
        // Return URL relative to public
        res.json({ url: `/uploads/${uniqueName}` });
    });
});

// Get Today's Schedule (NESTED: Missions -> Steps)
app.get('/api/schedule/today', (req, res) => {
    // 1. Get Levels with Profile info
    const sqlLevels = `
        SELECT l.*, p.title as profile_title
        FROM levels l
        LEFT JOIN profiles p ON l.profile_id = p.id
        ORDER BY CASE WHEN l.target_time IS NULL OR l.target_time = '' THEN 1 ELSE 0 END, l.target_time ASC, l.id ASC
    `;

    db.all(sqlLevels, [], (err, levels) => {
        if (err) return res.status(500).json({ error: err.message });
        if (levels.length === 0) return res.json([]);

        // 2. Get Missions
        const levelIds = levels.map(l => l.id).join(',');
        const sqlMissions = `SELECT * FROM missions WHERE level_id IN (${levelIds}) ORDER BY target_time`;

        db.all(sqlMissions, [], (err, missions) => {
            if (err) return res.status(500).json({ error: err.message });

            // 3. Get Steps
            const missionIds = missions.map(m => m.id).join(',');
            const sqlSteps = missionIds ? `SELECT * FROM steps WHERE mission_id IN (${missionIds}) ORDER BY display_order` : "";

            const runStepsQuery = missionIds ? new Promise((resolve, reject) => {
                db.all(sqlSteps, [], (err, steps) => err ? reject(err) : resolve(steps));
            }) : Promise.resolve([]);

            runStepsQuery.then(steps => {
                // 4. Nest Everything
                const result = levels.map(level => {
                    const levelMissions = missions
                        .filter(m => m.level_id === level.id)
                        .map(mission => ({
                            ...mission,
                            steps: steps.filter(s => s.mission_id === mission.id)
                        }));
                    return { ...level, missions: levelMissions };
                });

                res.json(result);
            }).catch(err => res.status(500).json({ error: err.message }));
        });
    });
});

// Mark Step Complete (Using 'type' to distinguish mission vs step if needed, but for now we track STEP IDs)
// The user wants checkboxes for subtasks. We will track everything by ID. 
// Note: If we want to track Mission completion, we can either infer it (all steps done) or track it separately.
// For simplicity, let's treat "Mission ID" and "Step ID" as unique trackable items (assuming simple ID space or separate tables).
// Since tables are separate, we need to know WHAT we are completing.
// Let's modify the progress table to handle {item_type, item_id} OR just use Step Progress.
// **Decision**: The prompt says "checkbox for sub tasks too".
// I will support tracking "steps". If the mission itself needs a check, I might need a "mission_progress" table or just repurpose.
// Let's stick to the existing "progress" table which tracks "step_id".
// I'll add a `mission_id` column to progress or create `mission_progress` table.
// EASIER: Just Use `progress` table for STEPS, and add logic for MISSIONS if requested.
// Wait, user asked "replace times on sub tasks to main task... make checkbox for sub tasks too".
// So both need checkboxes.
// I will add `mission_progress` table logic.

app.post('/api/progress', (req, res) => {
    const { guest_id, item_id, item_type, is_completed, date } = req.body;
    // item_type: 'mission' | 'step'
    // date: optional YYYY-MM-DD, default today

    const table = item_type === 'mission' ? 'mission_progress' : 'progress';
    const idColumn = item_type === 'mission' ? 'mission_id' : 'step_id';

    // Default to today in Israel (simple approx) or UTC. Let's use local date string from client or server.
    // Ideally client sends date. If not, server uses today.
    const completionDate = date || new Date().toISOString().split('T')[0];

    if (is_completed) {
        db.run(`INSERT OR IGNORE INTO ${table} (guest_id, ${idColumn}, completion_date, completed) VALUES (?, ?, ?, ?)`,
            [guest_id, item_id, completionDate, true], function (err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ success: true });
            });
    } else {
        db.run(`DELETE FROM ${table} WHERE guest_id = ? AND ${idColumn} = ? AND completion_date = ?`,
            [guest_id, item_id, completionDate], function (err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ success: true });
            });
    }
});

// Get Guest Progress (Returns { steps: [], missions: [] })
app.get('/api/progress/:guest_id', (req, res) => {
    const guestId = req.params.guest_id;
    const { date } = req.query; // YYYY-MM-DD

    // Create mission_progress table if missing (lazy migration)
    // Note: This run is redundant if already created, but safe.
    db.run(`CREATE TABLE IF NOT EXISTS mission_progress (guest_id INTEGER, mission_id INTEGER, completed BOOLEAN, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (guest_id, mission_id))`);

    let stepSql = `SELECT step_id FROM progress WHERE guest_id = ?`;
    let missionSql = `SELECT mission_id FROM mission_progress WHERE guest_id = ?`;
    const params = [guestId];

    if (date) {
        stepSql += ` AND completion_date = ?`;
        missionSql += ` AND completion_date = ?`;
        params.push(date);
    }

    const pSteps = new Promise((resolve) => {
        db.all(stepSql, params, (err, rows) => resolve(rows?.map(r => r.step_id) || []));
    });

    const pMissions = new Promise((resolve) => {
        db.all(missionSql, params, (err, rows) => resolve(rows?.map(r => r.mission_id) || []));
    });

    Promise.all([pSteps, pMissions]).then(([steps, missions]) => {
        res.json({ steps, missions });
    });
});


// ----------------------
// ADMIN CRUD (Full)
// ----------------------

// Create Level
app.post('/api/levels', (req, res) => {
    const { title, profile_id, target_time } = req.body;
    const pid = profile_id || 1;
    console.log("Creating Level:", { title, pid, target_time });
    db.run(`INSERT INTO levels (title, profile_id, target_time) VALUES (?, ?, ?)`, [title, pid, target_time], function (err) {
        if (err) {
            console.error("Create Level Error:", err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ id: this.lastID, title, profile_id: pid, target_time, missions: [] });
    });
});

// Create Mission
app.post('/api/missions', (req, res) => {
    // target_time kept for compatibility or optional usage, but duration is the key now
    const { level_id, title, description, image_url, images, target_time, duration } = req.body;
    db.run(`INSERT INTO missions (level_id, title, description, image_url, images, target_time, duration) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [level_id, title, description, image_url, images, target_time, duration], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, level_id, title, description, image_url, images, target_time, duration, steps: [] });
        });
});

// Create Step
app.post('/api/steps', (req, res) => {
    const { mission_id, title, subtitle, description, target_time, duration, image_url } = req.body;
    db.run(`INSERT INTO steps (mission_id, title, subtitle, description, target_time, duration, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [mission_id, title, subtitle, description, target_time, duration, image_url], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, mission_id, title, subtitle, description, target_time, duration, image_url });
        });
});

// Helper for Dynamic Updates
const textParams = (body, allowed) => {
    const keys = Object.keys(body).filter(k => allowed.includes(k));
    const sets = keys.map(k => `${k} = ?`).join(', ');
    const vals = keys.map(k => body[k]);
    return { sets, vals };
};

// Update Routes
app.put('/api/levels/:id', (req, res) => {
    const { sets, vals } = textParams(req.body, ['title', 'target_time']);
    if (!sets) return res.json({ success: true }); // No updates

    db.run(`UPDATE levels SET ${sets} WHERE id = ?`, [...vals, req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.put('/api/missions/:id', (req, res) => {
    // added duration
    const { sets, vals } = textParams(req.body, ['title', 'description', 'image_url', 'images', 'target_time', 'duration']);
    if (!sets) return res.json({ success: true });

    db.run(`UPDATE missions SET ${sets} WHERE id = ?`, [...vals, req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.put('/api/steps/:id', (req, res) => {
    const { sets, vals } = textParams(req.body, ['title', 'subtitle', 'description', 'target_time', 'duration', 'image_url']);
    if (!sets) return res.json({ success: true });

    db.run(`UPDATE steps SET ${sets} WHERE id = ?`, [...vals, req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// Reorder Missions
app.post('/api/missions/reorder', (req, res) => {
    const { updates } = req.body; // [{ id, display_order }]
    if (!updates || !Array.isArray(updates)) return res.status(400).json({ error: "Invalid updates" });

    db.serialize(() => {
        const stmt = db.prepare("UPDATE missions SET display_order = ? WHERE id = ?");
        updates.forEach(u => stmt.run(u.display_order, u.id));
        stmt.finalize();
    });
    res.json({ success: true });
});

// Reorder Steps
app.post('/api/steps/reorder', (req, res) => {
    const { updates } = req.body; // [{ id, display_order }]
    if (!updates || !Array.isArray(updates)) return res.status(400).json({ error: "Invalid updates" });

    db.serialize(() => {
        const stmt = db.prepare("UPDATE steps SET display_order = ? WHERE id = ?");
        updates.forEach(u => stmt.run(u.display_order, u.id));
        stmt.finalize();
    });
    res.json({ success: true });
});

// Delete generic
app.delete('/api/:type/:id', (req, res) => {
    const { type, id } = req.params;
    if (!['levels', 'missions', 'steps'].includes(type)) return res.status(400).json({ error: "Invalid type" });
    db.run(`DELETE FROM ${type} WHERE id = ?`, [id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// ----------------------
// SERVE STATIC ASSETS (Wait, this must be after API routes)
// ----------------------
const frontendPath = path.resolve(__dirname, '../frontend/dist');
console.log("Serving frontend from:", frontendPath);

// 1. Serve Static Files
app.use(express.static(frontendPath));

// 2. Handle React Routing (Catch-All)
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
