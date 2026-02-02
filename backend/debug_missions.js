const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = new sqlite3.Database(path.join(__dirname, 'toren_hazak.db'));

db.all("SELECT id, title, target_time FROM missions", [], (err, rows) => {
    if (err) {
        console.error("Error:", err.message);
        return;
    }
    console.log("Missions:", JSON.stringify(rows, null, 2));

    // Check if any have empty target_time
    const missing = rows.filter(r => !r.target_time);
    console.log(`\nTotal Missions: ${rows.length}`);
    console.log(`Missions missing target_time: ${missing.length}`);
});

db.close();
