const http = require('http');

function request(method, path, data) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: '/api' + path,
            method: method,
            headers: { 'Content-Type': 'application/json' }
        };

        const req = http.request(options, res => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => resolve(JSON.parse(body)));
        });

        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

async function test() {
    console.log("1. Creating Level with time '09:00'");
    const level = await request('POST', '/levels', { title: 'Test Level', target_time: '09:00', profile_id: 1 });
    console.log("Created:", level);

    console.log("2. Verifying Level in DB...");
    const profiles = await request('GET', '/profiles/1/content');
    const created = profiles.find(l => l.id === level.id);
    console.log("Found:", created?.title, "Time:", created?.target_time);

    console.log("3. Updating Level time to '10:00'");
    await request('PUT', `/levels/${level.id}`, { title: 'Test Level Updated', target_time: '10:00' });

    console.log("4. Verifying Update...");
    const profiles2 = await request('GET', '/profiles/1/content');
    const updated = profiles2.find(l => l.id === level.id);
    console.log("Found:", updated?.title, "Time:", updated?.target_time);

    if (updated.target_time === '10:00') console.log("SUCCESS: Time saved correctly.");
    else console.log("FAILURE: Time mismatch.");

    // Cleanup
    await request('DELETE', `/levels/${level.id}`);
}

test().catch(console.error);
