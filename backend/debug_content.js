const http = require('http');

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/profiles/1/content',
    method: 'GET',
};

const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        const content = JSON.parse(data);
        console.log(JSON.stringify(content, null, 2));

        // Calculate total steps like frontend
        const totalSteps = content.reduce((acc, level) =>
            acc + level.missions.reduce((mAcc, m) => mAcc + m.steps.length, 0), 0);
        console.log("TOTAL STEPS CALCULATION:", totalSteps);

        // List all steps
        const allSteps = [];
        content.forEach(l => l.missions.forEach(m => m.steps.forEach(s => allSteps.push(s.title))));
        console.log("ALL STEP TITLES:", allSteps);
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.end();
