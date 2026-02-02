const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

db.all("PRAGMA table_info(missions)", (err, rows) => {
    if (err) console.error(err);
    else console.log("Missions Schema:", rows);
});

db.all("SELECT * FROM missions LIMIT 1", (err, rows) => {
    if (err) console.error("Select Error:", err);
    else console.log("Select Sample:", rows);
});
