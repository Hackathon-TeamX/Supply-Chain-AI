// Global application state and data
const AppData = {
    supplyChainData: {
        inventory: [
            {"item": "Electronics", "current": 1250, "threshold": 1000, "predicted": 850, "status": "critical"},
            {"item": "Automotive Parts", "current": 3400, "threshold": 2500, "predicted": 3100, "status": "optimal"},
            {"item": "Food Products", "current": 890, "threshold": 1200, "predicted": 1400, "status": "low"},
            {"item": "Pharmaceuticals", "current": 2100, "threshold": 1500, "predicted": 1800, "status": "optimal"},
            {"item": "Textiles", "current": 650, "threshold": 800, "predicted": 900, "status": "critical"}
        ],
        suppliers: [
            {"id": 1, "name": "TechCorp Industries", "rating": 4.8, "location": "Shanghai, China", "products": ["Electronics", "Components"], "leadTime": 14, "reliability": 96},
            {"id": 2, "name": "AutoMax Solutions", "rating": 4.6, "location": "Detroit, USA", "products": ["Auto Parts", "Steel"], "leadTime": 7, "reliability": 94},
            {"id": 3, "name": "FreshHarvest Co", "rating": 4.2, "location": "California, USA", "products": ["Food", "Organic"], "leadTime": 3, "reliability": 91},
            {"id": 4, "name": "MedSupply Global", "rating": 4.9, "location": "Basel, Switzerland", "products": ["Pharmaceuticals"], "leadTime": 21, "reliability": 99}
        ],
        routes: [
            {"id": "R001", "origin": "Shanghai", "destination": "New York", "status": "active", "eta": "2025-09-28", "progress": 67},
            {"id": "R002", "origin": "Detroit", "destination": "Los Angeles", "status": "delayed", "eta": "2025-09-25", "progress": 45},
            {"id": "R003", "origin": "California", "destination": "Chicago", "status": "completed", "eta": "2025-09-22", "progress": 100},
            {"id": "R004", "origin": "Basel", "destination": "Boston", "status": "active", "eta": "2025-10-05", "progress": 23}
        ],
        metrics: {
            totalInventoryValue: 2847520,
            activeSuppliers: 47,
            avgDeliveryTime: 12.4,
            costSavings: 18.7,
            riskScore: 2.3,
            automationLevel: 89
        },
        alerts: [
            {"type": "critical", "message": "Electronics inventory below critical threshold", "time": "2 minutes ago"},
            {"type": "warning", "message": "Route R002 experiencing delays due to weather", "time": "15 minutes ago"},
            {"type": "success", "message": "AI successfully negotiated 8% cost reduction with TechCorp", "time": "1 hour ago"},
            {"type": "info", "message": "New supplier MedSupply Global added to network", "time": "3 hours ago"}
        ]
    },
    aiResponses: {
        greeting: "Hello! I'm your Autonomous Supply Chain AI Assistant. I can help you optimize inventory, negotiate with suppliers, predict demand, and manage logistics. What would you like to know?",
        inventoryAnalysis: "Based on current trends, I recommend increasing Electronics inventory by 40% and reducing Textiles by 15%. This will optimize storage costs while maintaining service levels.",
        supplierNegotiation: "I've analyzed market data and initiated negotiations with TechCorp Industries. Proposed terms: 8% volume discount for 6-month contract with guaranteed 95% on-time delivery.",
        riskAssessment: "Current risk level is LOW (2.3/10). Main concerns: Weather delays on Route R002, potential shortage in Electronics category. Recommended actions: Activate backup suppliers, reroute critical shipments.",
        demandForecast: "AI models predict 25% increase in Electronics demand over next 3 months. Pharmaceutical demand stable. Food products showing seasonal uptick of 15%.",
        routeOptimization: "Analyzing 47 active routes... Optimized path for Route R002 will reduce delivery time by 2.3 days and save $12,400 in fuel costs.",
        crisisResponse: "Crisis protocol activated. Implementing contingency plan Alpha-7. Rerouting critical shipments through backup suppliers. Estimated recovery time: 6 hours."
    }
};

// Charts storage
let charts = {};

// Utility function for formatting numbers
function formatNumber(value, decimals = 1) {
    if (typeof value !== 'number') return value;
    return Number(value.toFixed(decimals));
}

// Application initialization
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    showLoadingScreen();
    
    setTimeout(() => {
        hideLoadingScreen();
        setupEventListeners();
        renderDashboard();
        renderInventory();
        renderSuppliers();
        renderRoutes();
        renderAlerts();
        renderAnalytics();
        setupRealTimeUpdates();
        initializeCharts();
        setupParticleEffect();
    }, 2000);
}

function showLoadingScreen() {
    const overlay = document.getElementById('loadingOverlay');
    overlay.style.display = 'flex';
}

function hideLoadingScreen() {
    const overlay = document.getElementById('loadingOverlay');
    overlay.classList.add('hidden');
    setTimeout(() => {
        overlay.style.display = 'none';
    }, 500);
}

function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const viewName = item.getAttribute('data-view');
            switchView(viewName);
            
            // Update active state
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
        });
    });

    // Chat functionality
    const chatInput = document.getElementById('chatInput');
    const sendButton = document.getElementById('sendMessage');

    sendButton.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Supplier negotiation buttons
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('negotiate-btn')) {
            const supplierName = e.target.closest('.supplier-card').querySelector('.supplier-name').textContent;
            simulateNegotiation(supplierName);
        }
    });
}

function switchView(viewName) {
    // Hide all views
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
    
    // Show selected view
    const targetView = document.getElementById(`${viewName}-view`);
    if (targetView) {
        targetView.classList.add('active');
        
        // Trigger specific view initialization if needed
        if (viewName === 'forecasting') {
            initializeForecastChart();
        } else if (viewName === 'analytics') {
            initializeAnalyticsChart();
        }
    }
}

function renderDashboard() {
    // Update metrics with proper formatting
    const metrics = AppData.supplyChainData.metrics;
    document.getElementById('totalValue').textContent = `$${metrics.totalInventoryValue.toLocaleString()}`;
    document.getElementById('activeSuppliers').textContent = metrics.activeSuppliers;
    document.getElementById('avgDelivery').textContent = `${formatNumber(metrics.avgDeliveryTime, 1)} days`;
    document.getElementById('costSavings').textContent = `${formatNumber(metrics.costSavings, 1)}%`;
    document.getElementById('automationLevel').textContent = `${formatNumber(metrics.automationLevel, 0)}%`;
    
    // Risk score
    const riskScoreElement = document.getElementById('riskScore');
    if (riskScoreElement) {
        riskScoreElement.textContent = formatNumber(metrics.riskScore, 1);
    }
}

function renderAlerts() {
    const container = document.getElementById('alertsContainer');
    container.innerHTML = '';
    
    AppData.supplyChainData.alerts.forEach((alert, index) => {
        const alertElement = document.createElement('div');
        alertElement.className = `alert-item ${alert.type}`;
        alertElement.style.animationDelay = `${index * 0.1}s`;
        
        alertElement.innerHTML = `
            <div class="alert-message">${alert.message}</div>
            <div class="alert-time">${alert.time}</div>
        `;
        
        container.appendChild(alertElement);
    });
}

function renderAnalytics() {
    const analyticsContainer = document.querySelector('.analytics-dashboard');
    
    // Add comprehensive analytics content
    analyticsContainer.innerHTML = `
        <div class="analytics-grid">
            <div class="analytics-card">
                <h3><i class="fas fa-chart-line"></i> Performance Overview</h3>
                <div class="analytics-metrics">
                    <div class="analytics-metric">
                        <span class="metric-number">94.2%</span>
                        <span class="metric-label">On-Time Delivery</span>
                    </div>
                    <div class="analytics-metric">
                        <span class="metric-number">$2.4M</span>
                        <span class="metric-label">Cost Savings YTD</span>
                    </div>
                    <div class="analytics-metric">
                        <span class="metric-number">15.3%</span>
                        <span class="metric-label">Efficiency Gain</span>
                    </div>
                </div>
            </div>
            
            <div class="analytics-card">
                <h3><i class="fas fa-brain"></i> AI Optimization Results</h3>
                <div class="optimization-results">
                    <div class="optimization-item">
                        <span class="optimization-label">Route Optimization</span>
                        <span class="optimization-value success">+$340K saved</span>
                    </div>
                    <div class="optimization-item">
                        <span class="optimization-label">Inventory Management</span>
                        <span class="optimization-value success">-22% holding costs</span>
                    </div>
                    <div class="optimization-item">
                        <span class="optimization-label">Supplier Negotiations</span>
                        <span class="optimization-value success">-8.5% avg price</span>
                    </div>
                </div>
            </div>
            
            <div class="analytics-card full-width">
                <h3><i class="fas fa-chart-area"></i> Supply Chain Analytics Dashboard</h3>
                <img src="https://pplx-res.cloudinary.com/image/upload/v1755930001/pplx_project_search_images/5dc1db94dd565e41e289d4a5f80a60a9bd43b252.png" alt="Advanced Analytics Dashboard" class="analytics-visual">
            </div>
            
            <div class="analytics-card">
                <h3><i class="fas fa-cogs"></i> System Performance</h3>
                <div class="performance-grid">
                    <div class="performance-item">
                        <div class="performance-icon"><i class="fas fa-microchip"></i></div>
                        <div class="performance-details">
                            <span class="performance-label">CPU Usage</span>
                            <span class="performance-value">23%</span>
                        </div>
                    </div>
                    <div class="performance-item">
                        <div class="performance-icon"><i class="fas fa-database"></i></div>
                        <div class="performance-details">
                            <span class="performance-label">Data Processing</span>
                            <span class="performance-value">847 ops/sec</span>
                        </div>
                    </div>
                    <div class="performance-item">
                        <div class="performance-icon"><i class="fas fa-network-wired"></i></div>
                        <div class="performance-details">
                            <span class="performance-label">API Response</span>
                            <span class="performance-value">145ms</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="analytics-card">
                <h3><i class="fas fa-chart-pie"></i> Supply Chain Insights</h3>
                <div class="chart-wrapper" style="position: relative; height: 300px;">
                    <canvas id="analyticsChart"></canvas>
                </div>
            </div>
        </div>
    `;
}

function renderInventory() {
    const container = document.getElementById('inventoryGrid');
    container.innerHTML = '';
    
    AppData.supplyChainData.inventory.forEach(item => {
        const inventoryElement = document.createElement('div');
        inventoryElement.className = `inventory-item ${item.status}`;
        
        const percentage = (item.current / item.threshold) * 100;
        
        inventoryElement.innerHTML = `
            <div class="inventory-header">
                <div class="inventory-name">${item.item}</div>
                <div class="inventory-status ${item.status}">${item.status}</div>
            </div>
            <div class="inventory-details">
                <div class="inventory-detail">
                    <span class="inventory-detail-label">Current</span>
                    <span class="inventory-detail-value">${item.current.toLocaleString()}</span>
                </div>
                <div class="inventory-detail">
                    <span class="inventory-detail-label">Threshold</span>
                    <span class="inventory-detail-value">${item.threshold.toLocaleString()}</span>
                </div>
                <div class="inventory-detail">
                    <span class="inventory-detail-label">Predicted</span>
                    <span class="inventory-detail-value">${item.predicted.toLocaleString()}</span>
                </div>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${Math.min(percentage, 100)}%"></div>
            </div>
        `;
        
        container.appendChild(inventoryElement);
    });
}

function renderSuppliers() {
    const container = document.getElementById('suppliersGrid');
    container.innerHTML = '';
    
    AppData.supplyChainData.suppliers.forEach(supplier => {
        const supplierElement = document.createElement('div');
        supplierElement.className = 'supplier-card';
        
        const stars = '★'.repeat(Math.floor(supplier.rating)) + '☆'.repeat(5 - Math.floor(supplier.rating));
        
        supplierElement.innerHTML = `
            <div class="supplier-header">
                <div class="supplier-name">${supplier.name}</div>
                <div class="supplier-rating">
                    <span>${stars}</span>
                    <span>${supplier.rating}</span>
                </div>
            </div>
            <div class="supplier-details">
                <div class="supplier-detail">
                    <span class="supplier-detail-label">Location</span>
                    <span class="supplier-detail-value">${supplier.location}</span>
                </div>
                <div class="supplier-detail">
                    <span class="supplier-detail-label">Lead Time</span>
                    <span class="supplier-detail-value">${supplier.leadTime} days</span>
                </div>
                <div class="supplier-detail">
                    <span class="supplier-detail-label">Reliability</span>
                    <span class="supplier-detail-value">${supplier.reliability}%</span>
                </div>
                <div class="supplier-detail">
                    <span class="supplier-detail-label">Products</span>
                    <span class="supplier-detail-value">${supplier.products.join(', ')}</span>
                </div>
            </div>
            <button class="negotiate-btn">Negotiate with AI</button>
        `;
        
        container.appendChild(supplierElement);
    });
}

function renderRoutes() {
    const container = document.getElementById('routesGrid');
    container.innerHTML = '';
    
    AppData.supplyChainData.routes.forEach(route => {
        const routeElement = document.createElement('div');
        routeElement.className = 'route-card';
        
        routeElement.innerHTML = `
            <div class="route-id">${route.id}</div>
            <div class="route-path">
                <span>${route.origin}</span>
                <i class="fas fa-arrow-right route-arrow"></i>
                <span>${route.destination}</span>
            </div>
            <div class="route-progress">
                <div class="route-progress-fill" style="width: ${route.progress}%"></div>
            </div>
            <div class="route-status ${route.status}">${route.status}</div>
        `;
        
        container.appendChild(routeElement);
    });
}

function initializeCharts() {
    initializeInventoryChart();
}

function initializeInventoryChart() {
    const ctx = document.getElementById('inventoryChart');
    if (!ctx) return;
    
    const inventory = AppData.supplyChainData.inventory;
    
    if (charts.inventory) {
        charts.inventory.destroy();
    }
    
    charts.inventory = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: inventory.map(item => item.item),
            datasets: [{
                label: 'Current Stock',
                data: inventory.map(item => item.current),
                backgroundColor: '#1FB8CD',
                borderColor: '#e10600',
                borderWidth: 2
            }, {
                label: 'Threshold',
                data: inventory.map(item => item.threshold),
                backgroundColor: '#FFC185',
                borderColor: '#ff0000',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: '#ffffff'
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: '#cccccc'
                    },
                    grid: {
                        color: 'rgba(225, 6, 0, 0.1)'
                    }
                },
                y: {
                    ticks: {
                        color: '#cccccc'
                    },
                    grid: {
                        color: 'rgba(225, 6, 0, 0.1)'
                    }
                }
            }
        }
    });
}

function initializeForecastChart() {
    const ctx = document.getElementById('forecastChart');
    if (!ctx || charts.forecast) return;
    
    // Generate forecast data
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const electronicsData = [1250, 1180, 1350, 1420, 1580, 1750];
    const autoPartsData = [3400, 3350, 3500, 3600, 3750, 3900];
    const foodData = [890, 920, 1050, 1180, 1350, 1400];
    
    charts.forecast = new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [{
                label: 'Electronics',
                data: electronicsData,
                borderColor: '#e10600',
                backgroundColor: 'rgba(225, 6, 0, 0.1)',
                tension: 0.4,
                fill: true
            }, {
                label: 'Auto Parts',
                data: autoPartsData,
                borderColor: '#1FB8CD',
                backgroundColor: 'rgba(31, 184, 205, 0.1)',
                tension: 0.4,
                fill: true
            }, {
                label: 'Food Products',
                data: foodData,
                borderColor: '#FFC185',
                backgroundColor: 'rgba(255, 193, 133, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: '#ffffff'
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: '#cccccc'
                    },
                    grid: {
                        color: 'rgba(225, 6, 0, 0.1)'
                    }
                },
                y: {
                    ticks: {
                        color: '#cccccc'
                    },
                    grid: {
                        color: 'rgba(225, 6, 0, 0.1)'
                    }
                }
            }
        }
    });
}

function initializeAnalyticsChart() {
    const ctx = document.getElementById('analyticsChart');
    if (!ctx || charts.analytics) return;
    
    charts.analytics = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Electronics', 'Auto Parts', 'Food Products', 'Pharmaceuticals', 'Textiles'],
            datasets: [{
                data: [35, 25, 15, 20, 5],
                backgroundColor: ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5', '#5D878F'],
                borderColor: '#e10600',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: '#ffffff'
                    }
                }
            }
        }
    });
}

function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Add user message
    addMessageToChat(message, 'user');
    input.value = '';
    
    // Simulate AI response
    setTimeout(() => {
        const response = generateAIResponse(message);
        addMessageToChat(response, 'ai');
    }, 1000);
}

function addMessageToChat(message, type) {
    const container = document.getElementById('chatMessages');
    const messageElement = document.createElement('div');
    messageElement.className = `message ${type}-message`;
    
    const avatar = type === 'ai' ? '<i class="fas fa-robot"></i>' : '<i class="fas fa-user"></i>';
    
    if (type === 'ai') {
        messageElement.innerHTML = `
            <div class="message-avatar">${avatar}</div>
            <div class="message-content">
                <div class="typing-animation">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
                <p style="display: none;">${message}</p>
            </div>
        `;
        
        // Show typing animation, then message
        setTimeout(() => {
            const typingAnimation = messageElement.querySelector('.typing-animation');
            const messageText = messageElement.querySelector('p');
            typingAnimation.style.display = 'none';
            messageText.style.display = 'block';
        }, 1500);
    } else {
        messageElement.innerHTML = `
            <div class="message-avatar">${avatar}</div>
            <div class="message-content">
                <p>${message}</p>
            </div>
        `;
    }
    
    container.appendChild(messageElement);
    container.scrollTop = container.scrollHeight;
}

function generateAIResponse(userMessage) {
    const message = userMessage.toLowerCase();
    
    if (message.includes('inventory') || message.includes('stock')) {
        return AppData.aiResponses.inventoryAnalysis;
    } else if (message.includes('supplier') || message.includes('negotiate')) {
        return AppData.aiResponses.supplierNegotiation;
    } else if (message.includes('risk') || message.includes('crisis')) {
        return AppData.aiResponses.riskAssessment;
    } else if (message.includes('forecast') || message.includes('predict')) {
        return AppData.aiResponses.demandForecast;
    } else if (message.includes('route') || message.includes('delivery')) {
        return AppData.aiResponses.routeOptimization;
    } else if (message.includes('emergency') || message.includes('crisis')) {
        return AppData.aiResponses.crisisResponse;
    } else {
        return AppData.aiResponses.greeting;
    }
}

function simulateNegotiation(supplierName) {
    // Show loading state
    const button = event.target;
    const originalText = button.textContent;
    button.textContent = 'Negotiating...';
    button.disabled = true;
    
    setTimeout(() => {
        button.textContent = 'Negotiation Complete!';
        button.style.background = 'linear-gradient(45deg, #00ff41, #32cd32)';
        
        // Add success alert
        const newAlert = {
            type: 'success',
            message: `AI successfully negotiated improved terms with ${supplierName}`,
            time: 'Just now'
        };
        
        AppData.supplyChainData.alerts.unshift(newAlert);
        renderAlerts();
        
        setTimeout(() => {
            button.textContent = originalText;
            button.disabled = false;
            button.style.background = '';
        }, 3000);
    }, 2000);
}

function setupRealTimeUpdates() {
    // Simulate real-time data updates
    setInterval(() => {
        updateMetrics();
        updateRouteProgress();
        updateInventoryLevels();
    }, 5000);
    
    // Simulate new alerts
    setInterval(() => {
        if (Math.random() > 0.7) {
            generateRandomAlert();
        }
    }, 15000);
}

function updateMetrics() {
    const metrics = AppData.supplyChainData.metrics;
    
    // Simulate small changes with proper rounding
    metrics.totalInventoryValue += Math.floor(Math.random() * 10000) - 5000;
    metrics.avgDeliveryTime = formatNumber(metrics.avgDeliveryTime + (Math.random() - 0.5) * 0.5, 1);
    metrics.costSavings = formatNumber(metrics.costSavings + (Math.random() - 0.5) * 0.5, 1);
    metrics.automationLevel = formatNumber(Math.min(95, Math.max(85, metrics.automationLevel + (Math.random() - 0.5) * 2)), 0);
    
    // Update display
    renderDashboard();
}

function updateRouteProgress() {
    AppData.supplyChainData.routes.forEach(route => {
        if (route.status === 'active' && route.progress < 100) {
            route.progress = Math.min(100, route.progress + Math.random() * 5);
            if (route.progress >= 100) {
                route.status = 'completed';
            }
        }
    });
    
    renderRoutes();
}

function updateInventoryLevels() {
    AppData.supplyChainData.inventory.forEach(item => {
        // Simulate inventory consumption
        const change = Math.floor(Math.random() * 50) - 25;
        item.current = Math.max(0, item.current + change);
        
        // Update status based on current levels
        if (item.current < item.threshold * 0.8) {
            item.status = 'critical';
        } else if (item.current < item.threshold) {
            item.status = 'low';
        } else {
            item.status = 'optimal';
        }
    });
    
    renderInventory();
    if (charts.inventory) {
        initializeInventoryChart();
    }
}

function generateRandomAlert() {
    const alertTypes = ['warning', 'info', 'success'];
    const messages = [
        'New supplier contract automatically negotiated',
        'Route optimization saved $3,200 in shipping costs',
        'Inventory reorder triggered for critical items',
        'Weather alert: potential delays on eastern routes',
        'AI detected market price fluctuation opportunity'
    ];
    
    const newAlert = {
        type: alertTypes[Math.floor(Math.random() * alertTypes.length)],
        message: messages[Math.floor(Math.random() * messages.length)],
        time: 'Just now'
    };
    
    AppData.supplyChainData.alerts.unshift(newAlert);
    
    // Keep only recent alerts
    if (AppData.supplyChainData.alerts.length > 8) {
        AppData.supplyChainData.alerts.pop();
    }
    
    renderAlerts();
}

function setupParticleEffect() {
    // Create floating particles for enhanced sci-fi effect
    const particlesContainer = document.querySelector('.particles-container');
    
    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.style.cssText = `
            position: absolute;
            width: 2px;
            height: 2px;
            background: #e10600;
            border-radius: 50%;
            opacity: ${Math.random() * 0.5 + 0.2};
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            animation: float ${Math.random() * 10 + 10}s linear infinite;
            animation-delay: ${Math.random() * 10}s;
        `;
        
        particlesContainer.appendChild(particle);
    }
    
    // Add floating animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes float {
            0% {
                transform: translateY(100vh) translateX(0px);
                opacity: 0;
            }
            10% {
                opacity: 0.8;
            }
            90% {
                opacity: 0.8;
            }
            100% {
                transform: translateY(-100px) translateX(${Math.random() * 200 - 100}px);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

// Crisis simulation for demo purposes
function triggerCrisisDemo() {
    const crisisAlert = {
        type: 'critical',
        message: 'CRISIS DETECTED: Major supplier disruption in Asia-Pacific region',
        time: 'URGENT - NOW'
    };
    
    AppData.supplyChainData.alerts.unshift(crisisAlert);
    AppData.supplyChainData.metrics.riskScore = 8.7;
    
    renderAlerts();
    renderDashboard();
    
    // Auto-switch to crisis view
    switchView('crisis');
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    document.querySelector('[data-view="crisis"]').classList.add('active');
}

// Initialize demo crisis after some time
setTimeout(triggerCrisisDemo, 30000);