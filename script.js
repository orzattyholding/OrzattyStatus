document.addEventListener('DOMContentLoaded', () => {
    const servicesContainer = document.getElementById('services-container');
    const globalStatusContainer = document.getElementById('global-status');

    // Simulate real data fetching (in a real scenario, this would be an API call)
    const mockServicesData = [
        {
            id: 'global-edge',
            name: 'OrzattyCDN Global Edge',
            description: 'Core CDN infrastructure and routing (HTTP/3)',
            status: 'operational' // 'operational', 'degraded', 'outage'
        },
        {
            id: 'wp-origin-proxy',
            name: 'WordPress Origin Proxy',
            description: '/wp/ routing and ImageXR optimization',
            status: 'operational'
        },
        {
            id: 'modern-support',
            name: 'Modern JS Delivery',
            description: 'JSR & ESM+ module serving via esm.sh',
            status: 'operational'
        },
        {
            id: 'ai-indexing',
            name: 'AI-Ready Indexing',
            description: 'Native llm.txt generation for AI agents',
            status: 'operational'
        },
        {
            id: 'api',
            name: 'Orzatty API',
            description: 'Management API and Dashboard endpoints',
            status: 'operational'
        }
    ];

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

            const card = document.createElement('div');
            card.className = 'service-card';

            card.innerHTML = `
                <div class="service-info">
                    <h3 class="service-name">${service.name}</h3>
                    <p class="service-description">${service.description}</p>
                </div>
                <div class="service-status">
                    <span class="status-icon ${config.iconClass}"></span>
                    <span>${config.text}</span>
                </div>
            `;

            servicesContainer.appendChild(card);
        });
    }

    // Simulate loading delay
    renderSkeleton();

    setTimeout(() => {
        renderServices(mockServicesData);
        const globalStatus = calculateGlobalStatus(mockServicesData);
        updateGlobalStatus(globalStatus);
    }, 800);

});