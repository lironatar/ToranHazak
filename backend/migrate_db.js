const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = new sqlite3.Database(path.join(__dirname, 'toren_hazak.db'));

db.serialize(() => {
    db.run("ALTER TABLE missions ADD COLUMN target_time TEXT", (err) => {
        if (err) console.log("Error adding column (missions.target_time):", err.message);
        else console.log("Added target_time to missions.");
    });

    // Add duration to steps if not exists
    db.run("ALTER TABLE steps ADD COLUMN duration INTEGER", (err) => {
        if (err) console.log("Error adding column (steps.duration):", err.message);
        else console.log("Added duration to steps.");
    });

    // REFACTORING: Shift time to Levels, Duration to Missions
    db.run("ALTER TABLE levels ADD COLUMN target_time TEXT", (err) => {
        if (err) console.log("Error adding column (levels.target_time):", err.message);
        else console.log("Added target_time to levels.");
    });

    db.run("ALTER TABLE missions ADD COLUMN duration INTEGER", (err) => {
        if (err) console.log("Error adding column (missions.duration):", err.message);
        else console.log("Added duration to missions.");
    });

    // GUEST MIGRATION: Link to Unit and Status
    db.run("ALTER TABLE guests ADD COLUMN unit_id INTEGER", (err) => {
        if (err) console.log("Error adding column (guests.unit_id):", err.message);
        else console.log("Added unit_id to guests.");
    });

    db.run("ALTER TABLE guests ADD COLUMN status TEXT DEFAULT 'pending_unit_selection'", (err) => {
        if (err) console.log("Error adding column (guests.status):", err.message);
        else console.log("Added status to guests.");
    });

    // Multi-Image Support
    db.run("ALTER TABLE missions ADD COLUMN images TEXT", (err) => {
        if (err) console.log("Error adding column (missions.images):", err.message);
        else console.log("Added images to missions.");
    });
});

db.close();
