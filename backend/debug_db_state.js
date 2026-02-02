const db = require('./database');

db.serialize(() => {
    console.log("--- GUEST PROFILES ---");
    db.all("SELECT id, first_name, last_name, active_profile_id, profile_id FROM guests", (err, rows) => {
        if (err) console.error(err);
        else console.log(JSON.stringify(rows, null, 2));
    });

    console.log("--- PROFILES ---");
    db.all("SELECT * FROM profiles", (err, rows) => {
        if (err) console.error(err);
        else console.log(JSON.stringify(rows, null, 2));
    });
});
