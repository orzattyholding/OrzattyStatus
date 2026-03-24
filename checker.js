const fs = require('fs');
const https = require('https');
const http = require('http');

const CONFIG_FILE = './config.json';
const STATUS_DATA_FILE = './status-data.json';
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

    let configData;
    try {
        const rawConfig = fs.readFileSync(CONFIG_FILE, 'utf8');
        configData = JSON.parse(rawConfig);
    } catch (err) {
        console.error("Error reading config.json", err);
        process.exit(1);
    }

    let statusData = { monitors: [] };
    try {
        if (fs.existsSync(STATUS_DATA_FILE)) {
            const rawStatus = fs.readFileSync(STATUS_DATA_FILE, 'utf8');
            statusData = JSON.parse(rawStatus);
        }
    } catch (err) {
        console.log("No existing status-data.json found, creating a new one.");
    }

    const timestamp = new Date().toISOString();

    for (const configMonitor of configData.monitors) {
        if (!configMonitor.url) continue;

        // Find or create the corresponding status monitor
        let statusMonitor = statusData.monitors.find(m => m.id === configMonitor.id);
        if (!statusMonitor) {
            statusMonitor = {
                id: configMonitor.id,
                name: configMonitor.name,
                description: configMonitor.description,
                status: 'unknown',
                history: []
            };
            statusData.monitors.push(statusMonitor);
        }

        // Always sync the name and description from the config
        statusMonitor.name = configMonitor.name;
        statusMonitor.description = configMonitor.description;

        console.log(`Checking ${configMonitor.name} (${configMonitor.url})...`);
        const result = await checkUrl(configMonitor.url);

        console.log(`Result: ${result.status} in ${result.responseTime}ms`);

        // Update current status
        statusMonitor.status = result.status;

        // Add new record
        statusMonitor.history.push({
            timestamp: timestamp,
            status: result.status,
            responseTime: result.responseTime
        });

        // Trim history to limit
        if (statusMonitor.history.length > HISTORY_LIMIT) {
            statusMonitor.history = statusMonitor.history.slice(-HISTORY_LIMIT);
        }
    }

    // Clean up any monitors that exist in statusData but were removed from configData
    const configIds = configData.monitors.map(m => m.id);
    statusData.monitors = statusData.monitors.filter(m => configIds.includes(m.id));

    // Save updated data
    fs.writeFileSync(STATUS_DATA_FILE, JSON.stringify(statusData, null, 2));
    console.log('Finished checks and saved status-data.json');
}

runChecks();