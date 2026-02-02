const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'toren_hazak.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database ' + dbPath + ': ' + err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

db.serialize(() => {
    // Create Profiles table
    // Create Units table (New Top Level)
    db.run(`CREATE TABLE IF NOT EXISTS units (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        image_url TEXT
    )`, (err) => {
        if (!err) {
            // Create Default Unit
            db.get("SELECT count(*) as count FROM units", (err, row) => {
                if (row.count === 0) {
                    db.run(`INSERT INTO units (title, description) VALUES ('פלוגה כללית', 'יחידת ברירת מחדל')`);
                }
            });
        }
    });

    // Create Profiles table (Linked to Unit)
    db.run(`CREATE TABLE IF NOT EXISTS profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        unit_id INTEGER, -- Link to Unit
        title TEXT NOT NULL,
        description TEXT,
        image_url TEXT, -- Add image for Card UI
        is_active INTEGER DEFAULT 1,
        FOREIGN KEY (unit_id) REFERENCES units (id) ON DELETE CASCADE
    )`, (err) => {
        if (!err) {
            // Migration: Add unit_id and image_url column
            db.run(`ALTER TABLE profiles ADD COLUMN unit_id INTEGER`, () => {
                // Assign existing profiles to default unit (1)
                db.run(`UPDATE profiles SET unit_id = 1 WHERE unit_id IS NULL`);
            });
            db.run(`ALTER TABLE profiles ADD COLUMN image_url TEXT`, () => { });

            // Create Default Profile if none exists
            db.get("SELECT count(*) as count FROM profiles", (err, row) => {
                if (row.count === 0) {
                    db.run(`INSERT INTO profiles (title, description, unit_id) VALUES ('כללי', 'פרופיל ברירת מחדל', 1)`, function (err) {
                        if (!err) {
                            const defaultProfileId = this.lastID;
                            // Assign existing levels to this profile (Migration)
                            db.run(`UPDATE levels SET profile_id = ? WHERE profile_id IS NULL`, [defaultProfileId]);
                        }
                    });
                }
            });
        }
    });

    // Create Levels table (Updated with profile_id)
    db.run(`CREATE TABLE IF NOT EXISTS levels (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        profile_id INTEGER,
        title TEXT NOT NULL,
        target_time TEXT, -- New: Time for the level block
        display_order INTEGER DEFAULT 0,
        FOREIGN KEY (profile_id) REFERENCES profiles (id) ON DELETE CASCADE
    )`, (err) => {
        // Migration: Add columns if they don't exist
        if (!err) {
            db.run(`ALTER TABLE levels ADD COLUMN profile_id INTEGER`, () => { });
            db.run(`ALTER TABLE levels ADD COLUMN target_time TEXT`, () => { });
        }
    });

    // Create Missions table
    db.run(`CREATE TABLE IF NOT EXISTS missions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        level_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        image_url TEXT,
        target_time TEXT,
        duration INTEGER,
        display_order INTEGER DEFAULT 0,
        FOREIGN KEY (level_id) REFERENCES levels (id) ON DELETE CASCADE
    )`, (err) => {
        if (!err) {
            db.run(`ALTER TABLE missions ADD COLUMN target_time TEXT`, () => { });
            db.run(`ALTER TABLE missions ADD COLUMN duration INTEGER`, () => { });
        }
    });

    // Create Steps table
    db.run(`CREATE TABLE IF NOT EXISTS steps (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mission_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        subtitle TEXT,
        description TEXT,
        image_url TEXT,
        image_url TEXT,
        target_time TEXT, -- Keeping for backward compatibility or direct timestamps if needed
        duration INTEGER, -- New: Duration in minutes
        display_order INTEGER DEFAULT 0,
        FOREIGN KEY (mission_id) REFERENCES missions (id) ON DELETE CASCADE
    )`, (err) => {
        if (!err) {
            db.run(`ALTER TABLE steps ADD COLUMN duration INTEGER`, (err) => {
                // Ignore if exists
            });
        }
    });

    // Create Guests table
    db.run(`CREATE TABLE IF NOT EXISTS guests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Create Progress table
    db.run(`CREATE TABLE IF NOT EXISTS progress (
        guest_id INTEGER, 
        step_id INTEGER, 
        completion_date TEXT, 
        completed BOOLEAN, 
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, 
        PRIMARY KEY (guest_id, step_id, completion_date)
    )`);

    // Create Mission Progress table
    db.run(`CREATE TABLE IF NOT EXISTS mission_progress (
        guest_id INTEGER, 
        mission_id INTEGER, 
        completion_date TEXT, 
        completed BOOLEAN, 
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, 
        PRIMARY KEY (guest_id, mission_id, completion_date)
    )`);
});

module.exports = db;
