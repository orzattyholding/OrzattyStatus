document.addEventListener('DOMContentLoaded', () => {
    const servicesContainer = document.getElementById('services-container');
    const globalStatusContainer = document.getElementById('global-status');

    // Status display configuration
    const statusConfig = {
        'operational': { text: 'Operational', class: 'operational', iconClass: 'operational' },
        'degraded': { text: 'Degraded Performance', class: 'degraded', iconClass: 'degraded' },
        'outage': { text: 'Major Outage', class: 'outage', iconClass: 'outage' }
    };

    function renderSkeleton() {
        servicesContainer.innerHTML = '';
        for(let i=0; i<5; i++) {
            const skeletonCard = document.createElement('div');
            skeletonCard.className = 'service-card skeleton';
            skeletonCard.style.height = '80px';
            servicesContainer.appendChild(skeletonCard);
        }
    }

    function calculateGlobalStatus(services) {
        let hasOutage = false;
        let hasDegraded = false;

        services.forEach(service => {
            if (service.status === 'outage') hasOutage = true;
            if (service.status === 'degraded') hasDegraded = true;
        });

        if (hasOutage) return 'outage';
        if (hasDegraded) return 'degraded';
        return 'operational';
    }

    function updateGlobalStatus(statusKey) {
        const config = statusConfig[statusKey];
        globalStatusContainer.innerHTML = `
            <span class="status-icon ${config.iconClass}"></span>
            <span class="status-text">${statusKey === 'operational' ? 'All Systems Operational' : config.text}</span>
        `;
    }

    function renderServices(services) {
        servicesContainer.innerHTML = '';

        services.forEach(service => {
            const config = statusConfig[service.status];

            // Build history bars
            const historyBlocks = 60; // Render 60 bars max
            let historyHtml = '';

            // Pad array with empty history if less than historyBlocks
            let padding = [];
            const actualHistoryLen = (service.history && service.history.length) ? service.history.length : 0;
            if (actualHistoryLen < historyBlocks) {
                for (let i = 0; i < (historyBlocks - actualHistoryLen); i++) {
                    padding.push({ status: 'unknown' });
                }
            }

            // Combine padding and actual history
            const fullHistory = [...padding, ...(service.history || [])];

            fullHistory.forEach((record, index) => {
                let barClass = '';
                let tooltipText = 'No data';
                if (record.status === 'operational') {
                    barClass = 'operational';
                    tooltipText = `${new Date(record.timestamp).toLocaleString()} - Operational (${record.responseTime}ms)`;
                } else if (record.status === 'outage') {
                    barClass = 'outage';
                    tooltipText = `${new Date(record.timestamp).toLocaleString()} - Outage (${record.responseTime}ms)`;
                }

                historyHtml += `
                    <div class="history-bar ${barClass}">
                        <span class="tooltip">${tooltipText}</span>
                    </div>
                `;
            });

            const card = document.createElement('div');
            card.className = 'service-card';
            card.style.flexDirection = 'column';
            card.style.alignItems = 'stretch';

            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                    <div class="service-info">
                        <h3 class="service-name">${service.name}</h3>
                        <p class="service-description">${service.description}</p>
                    </div>
                    <div class="service-status">
                        <span class="status-icon ${config.iconClass}"></span>
                        <span>${config.text}</span>
                    </div>
                </div>
                <div class="history-container">
                    <div class="history-bars">
                        ${historyHtml}
                    </div>
                    <div class="history-legend">
                        <span>5 hours ago</span>
                        <span>Now</span>
                    </div>
                </div>
            `;

            servicesContainer.appendChild(card);
        });
    }

    async function loadMonitors() {
        renderSkeleton();
        try {
            // Simulate network delay for effect
            await new Promise(resolve => setTimeout(resolve, 800));

            const response = await fetch('status-data.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            const services = data.monitors || [];

            renderServices(services);
            const globalStatus = calculateGlobalStatus(services);
            updateGlobalStatus(globalStatus);

        } catch (error) {
            console.error("Could not load monitors:", error);
            servicesContainer.innerHTML = '<div class="service-card"><p>Error loading status data.</p></div>';
            updateGlobalStatus('outage');
        }
    }

    // Auto refresh every 60 seconds to simulate real-time updates from GitHub Pages
    setInterval(loadMonitors, 60000);

    loadMonitors();
});