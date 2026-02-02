const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'toren_hazak.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    console.log("--- LEVELS ---");
    db.all("SELECT id, title, target_time, profile_id FROM levels", (err, rows) => {
        if (err) console.error(err);
        else console.table(rows);
    });

    console.log("\n--- MISSIONS ---");
    db.all("SELECT id, level_id, title, target_time FROM missions", (err, rows) => {
        if (err) console.error(err);
        else console.table(rows);
    });
});

db.close();
