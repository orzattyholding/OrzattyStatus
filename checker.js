const fs = require('fs');
const https = require('https');
const http = require('http');

const MONITORS_FILE = './monitors.json';
const HISTORY_LIMIT = 60; // Keep last 60 checks (e.g., 5 hours at 5-min intervals)

async function checkUrl(url) {
    const startTime = Date.now();

    return new Promise((resolve) => {
        const client = url.startsWith('https') ? https : http;
        const req = client.get(url, (res) => {
            const responseTime = Date.now() - startTime;
            if (res.statusCode >= 200 && res.statusCode < 400) {
                resolve({ status: 'operational', responseTime });
            } else {
                resolve({ status: 'outage', responseTime });
            }
        });

        req.on('error', (e) => {
            console.error(`Error checking ${url}: ${e.message}`);
            resolve({ status: 'outage', responseTime: Date.now() - startTime });
        });

        // Timeout after 10 seconds
        req.setTimeout(10000, () => {
            req.destroy();
            resolve({ status: 'outage', responseTime: 10000 });
        });
    });
}

async function runChecks() {
    console.log(`Starting checks at ${new Date().toISOString()}`);

    let rawData;
    try {
        rawData = fs.readFileSync(MONITORS_FILE, 'utf8');
    } catch (err) {
        console.error("Error reading monitors.json", err);
        process.exit(1);
    }

    const data = JSON.parse(rawData);
    const timestamp = new Date().toISOString();

    for (const monitor of data.monitors) {
        if (!monitor.url) continue;

        console.log(`Checking ${monitor.name} (${monitor.url})...`);
        const result = await checkUrl(monitor.url);

        console.log(`Result: ${result.status} in ${result.responseTime}ms`);

        // Update current status
        monitor.status = result.status;

        // Ensure history array exists
        if (!monitor.history) {
            monitor.history = [];
        }

        // Add new record
        monitor.history.push({
            timestamp: timestamp,
            status: result.status,
            responseTime: result.responseTime
        });

        // Trim history to limit
        if (monitor.history.length > HISTORY_LIMIT) {
            monitor.history = monitor.history.slice(-HISTORY_LIMIT);
        }
    }

    // Save updated data
    fs.writeFileSync(MONITORS_FILE, JSON.stringify(data, null, 2));
    console.log('Finished checks and saved monitors.json');
}

runChecks();