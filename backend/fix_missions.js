const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = new sqlite3.Database(path.join(__dirname, 'toren_hazak.db'));

db.serialize(() => {
    db.run(`UPDATE missions SET target_time = '08:00' WHERE target_time IS NULL OR target_time = ''`, function (err) {
        if (err) {
            console.error("Error updating missions:", err.message);
        } else {
            console.log(`Updated ${this.changes} missions with default target_time '08:00'`);
        }
    });
});

db.close();
