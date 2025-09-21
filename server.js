# Autonomous Supply Chain Rescue AI - Backend Server

## server.js
```javascript
const express = require('express');
const cors = require('cors');
const { WebSocketServer } = require('ws');
const http = require('http');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Supply Chain Data Store
let supplyChainData = {
    inventory: [
        { item: "Electronics", current: 1250, threshold: 1000, predicted: 850, status: "critical" },
        { item: "Automotive Parts", current: 3400, threshold: 2500, predicted: 3100, status: "optimal" },
        { item: "Food Products", current: 890, threshold: 1200, predicted: 1400, status: "low" },
        { item: "Pharmaceuticals", current: 2100, threshold: 1500, predicted: 1800, status: "optimal" },
        { item: "Textiles", current: 650, threshold: 800, predicted: 900, status: "critical" }
    ],
    suppliers: [
        { id: 1, name: "TechCorp Industries", rating: 4.8, location: "Shanghai, China", products: ["Electronics"], leadTime: 14, reliability: 96, negotiationStatus: "active" },
        { id: 2, name: "AutoMax Solutions", rating: 4.6, location: "Detroit, USA", products: ["Auto Parts"], leadTime: 7, reliability: 94, negotiationStatus: "completed" },
        { id: 3, name: "FreshHarvest Co", rating: 4.2, location: "California, USA", products: ["Food"], leadTime: 3, reliability: 91, negotiationStatus: "pending" },
        { id: 4, name: "MedSupply Global", rating: 4.9, location: "Basel, Switzerland", products: ["Pharmaceuticals"], leadTime: 21, reliability: 99, negotiationStatus: "active" }
    ],
    routes: [
        { id: "R001", origin: "Shanghai", destination: "New York", status: "active", eta: "2025-09-28", progress: 67, risk: "low" },
        { id: "R002", origin: "Detroit", destination: "Los Angeles", status: "delayed", eta: "2025-09-25", progress: 45, risk: "high" },
        { id: "R003", origin: "California", destination: "Chicago", status: "completed", eta: "2025-09-22", progress: 100, risk: "low" },
        { id: "R004", origin: "Basel", destination: "Boston", status: "active", eta: "2025-10-05", progress: 23, risk: "medium" }
    ],
    metrics: {
        totalInventoryValue: 2847520,
        activeSuppliers: 47,
        avgDeliveryTime: 12.4,
        costSavings: 18.7,
        riskScore: 2.3,
        automationLevel: 89,
        ordersProcessed: 1247,
        predictiveAccuracy: 94.2
    },
    alerts: [
        { type: "critical", message: "Electronics inventory below critical threshold", time: new Date().toISOString(), priority: "high" },
        { type: "warning", message: "Route R002 experiencing delays due to weather", time: new Date().toISOString(), priority: "medium" },
        { type: "success", message: "AI successfully negotiated 8% cost reduction with TechCorp", time: new Date().toISOString(), priority: "low" },
        { type: "info", message: "New supplier MedSupply Global added to network", time: new Date().toISOString(), priority: "low" }
    ]
};

// WebSocket connections store
const clients = new Set();

// WebSocket connection handler
wss.on('connection', (ws) => {
    clients.add(ws);
    console.log('New client connected. Total clients:', clients.size);

    // Send initial data to new client
    ws.send(JSON.stringify({ type: 'initial', data: supplyChainData }));

    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);
            await handleWebSocketMessage(ws, data);
        } catch (error) {
            console.error('WebSocket message error:', error);
            ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
        }
    });

    ws.on('close', () => {
        clients.delete(ws);
        console.log('Client disconnected. Total clients:', clients.size);
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        clients.delete(ws);
    });
});

// WebSocket message handler
async function handleWebSocketMessage(ws, data) {
    switch (data.type) {
        case 'chat':
            const aiResponse = await processAIChat(data.message);
            ws.send(JSON.stringify({ type: 'chat_response', message: aiResponse }));
            break;
        
        case 'negotiate':
            const negotiationResult = await processSupplierNegotiation(data.supplierId, data.terms);
            broadcastUpdate({ type: 'negotiation_update', data: negotiationResult });
            break;
        
        case 'optimize_route':
            const routeOptimization = await optimizeRoute(data.routeId);
            broadcastUpdate({ type: 'route_optimized', data: routeOptimization });
            break;
        
        case 'request_restock':
            const restockResult = await processAutomaticRestock(data.item);
            broadcastUpdate({ type: 'restock_initiated', data: restockResult });
            break;
            
        default:
            ws.send(JSON.stringify({ type: 'error', message: 'Unknown message type' }));
    }
}

// AI Chat Processing
async function processAIChat(message) {
    try {
        const prompt = `You are an AI assistant for an Autonomous Supply Chain Rescue system. 
        User question: "${message}"
        
        Current supply chain status:
        - Total inventory value: $${supplyChainData.metrics.totalInventoryValue.toLocaleString()}
        - Active suppliers: ${supplyChainData.metrics.activeSuppliers}
        - Risk score: ${supplyChainData.metrics.riskScore}/10
        - Automation level: ${supplyChainData.metrics.automationLevel}%
        
        Critical items needing attention:
        ${supplyChainData.inventory.filter(item => item.status === 'critical').map(item => `- ${item.item}: ${item.current} units (threshold: ${item.threshold})`).join('\\n')}
        
        Provide a helpful, specific response about supply chain optimization, inventory management, or supplier relations.`;

        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        console.error('AI chat error:', error);
        return "I apologize, but I'm experiencing technical difficulties. Please try again or contact system administrator.";
    }
}

// Supplier Negotiation Processing
async function processSupplierNegotiation(supplierId, terms) {
    try {
        const supplier = supplyChainData.suppliers.find(s => s.id == supplierId);
        if (!supplier) {
            throw new Error('Supplier not found');
        }

        const prompt = `As an AI supply chain negotiation agent, analyze this negotiation scenario:
        
        Supplier: ${supplier.name}
        Current Rating: ${supplier.rating}/5
        Reliability: ${supplier.reliability}%
        Lead Time: ${supplier.leadTime} days
        
        Negotiation Terms: ${JSON.stringify(terms)}
        
        Based on market conditions and supplier performance, provide a realistic negotiation outcome including:
        1. Likelihood of acceptance (percentage)
        2. Counter-offer terms
        3. Recommended strategy
        
        Format as JSON with fields: acceptance_likelihood, counter_offer, strategy, estimated_savings.`;

        const result = await model.generateContent(prompt);
        const aiResponse = JSON.parse(result.response.text().replace(/```json|```/g, ''));
        
        // Update supplier negotiation status
        supplier.negotiationStatus = 'in_progress';
        supplier.lastNegotiation = new Date().toISOString();
        
        return {
            supplierId,
            supplier: supplier.name,
            negotiationResult: aiResponse,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error('Negotiation error:', error);
        return {
            supplierId,
            error: 'Negotiation failed',
            timestamp: new Date().toISOString()
        };
    }
}

// Route Optimization
async function optimizeRoute(routeId) {
    const route = supplyChainData.routes.find(r => r.id === routeId);
    if (!route) {
        throw new Error('Route not found');
    }

    // Simulate AI-powered route optimization
    const optimizationFactors = {
        weather: Math.random() > 0.3 ? 'favorable' : 'challenging',
        traffic: Math.random() > 0.4 ? 'light' : 'heavy',
        fuelCosts: Math.random() * 100 + 50,
        alternativeRoutes: Math.floor(Math.random() * 3) + 1
    };

    // Apply optimization
    if (route.status === 'delayed' && optimizationFactors.alternativeRoutes > 1) {
        route.status = 'rerouted';
        route.progress = Math.min(route.progress + 10, 100);
        route.risk = optimizationFactors.weather === 'favorable' ? 'low' : 'medium';
        
        supplyChainData.alerts.unshift({
            type: 'success',
            message: `Route ${routeId} successfully optimized - ETA improved by 2 hours`,
            time: new Date().toISOString(),
            priority: 'medium'
        });
    }

    return {
        routeId,
        optimizationFactors,
        newStatus: route.status,
        estimatedSavings: Math.floor(Math.random() * 500) + 100,
        timestamp: new Date().toISOString()
    };
}

// Automatic Restocking
async function processAutomaticRestock(itemName) {
    const inventoryItem = supplyChainData.inventory.find(item => item.item === itemName);
    if (!inventoryItem) {
        throw new Error('Inventory item not found');
    }

    // Find suitable suppliers
    const suitableSuppliers = supplyChainData.suppliers.filter(supplier => 
        supplier.products.some(product => 
            product.toLowerCase().includes(itemName.toLowerCase()) || 
            itemName.toLowerCase().includes(product.toLowerCase())
        )
    );

    if (suitableSuppliers.length === 0) {
        throw new Error('No suitable suppliers found');
    }

    // Select best supplier based on rating and lead time
    const bestSupplier = suitableSuppliers.reduce((best, current) => {
        const currentScore = current.rating * 10 + (20 - current.leadTime);
        const bestScore = best.rating * 10 + (20 - best.leadTime);
        return currentScore > bestScore ? current : best;
    });

    // Calculate reorder quantity
    const reorderQuantity = Math.max(
        inventoryItem.threshold - inventoryItem.current,
        inventoryItem.threshold * 0.5
    );

    // Simulate order processing
    inventoryItem.current += Math.floor(reorderQuantity);
    inventoryItem.status = inventoryItem.current >= inventoryItem.threshold ? 'optimal' : 'low';

    // Add alert
    supplyChainData.alerts.unshift({
        type: 'success',
        message: `Automatic restock initiated: ${Math.floor(reorderQuantity)} units of ${itemName} from ${bestSupplier.name}`,
        time: new Date().toISOString(),
        priority: 'medium'
    });

    return {
        item: itemName,
        quantity: Math.floor(reorderQuantity),
        supplier: bestSupplier.name,
        estimatedCost: Math.floor(reorderQuantity * (Math.random() * 50 + 20)),
        expectedDelivery: new Date(Date.now() + bestSupplier.leadTime * 24 * 60 * 60 * 1000).toISOString(),
        timestamp: new Date().toISOString()
    };
}

// Broadcast updates to all connected clients
function broadcastUpdate(update) {
    const message = JSON.stringify(update);
    clients.forEach(client => {
        if (client.readyState === client.OPEN) {
            client.send(message);
        }
    });
}

// API Routes
app.get('/api/dashboard', (req, res) => {
    res.json(supplyChainData);
});

app.get('/api/inventory', (req, res) => {
    res.json(supplyChainData.inventory);
});

app.get('/api/suppliers', (req, res) => {
    res.json(supplyChainData.suppliers);
});

app.get('/api/routes', (req, res) => {
    res.json(supplyChainData.routes);
});

app.get('/api/metrics', (req, res) => {
    res.json(supplyChainData.metrics);
});

app.get('/api/alerts', (req, res) => {
    res.json(supplyChainData.alerts);
});

app.post('/api/inventory/:item/restock', async (req, res) => {
    try {
        const result = await processAutomaticRestock(req.params.item);
        broadcastUpdate({ type: 'restock_initiated', data: result });
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/suppliers/:id/negotiate', async (req, res) => {
    try {
        const result = await processSupplierNegotiation(req.params.id, req.body);
        broadcastUpdate({ type: 'negotiation_update', data: result });
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/routes/:id/optimize', async (req, res) => {
    try {
        const result = await optimizeRoute(req.params.id);
        broadcastUpdate({ type: 'route_optimized', data: result });
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/chat', async (req, res) => {
    try {
        const response = await processAIChat(req.body.message);
        res.json({ response });
    } catch (error) {
        res.status(500).json({ error: 'AI service unavailable' });
    }
});

// Real-time data simulation
setInterval(() => {
    // Update metrics
    supplyChainData.metrics.automationLevel = Math.min(100, supplyChainData.metrics.automationLevel + Math.random() * 0.5 - 0.25);
    supplyChainData.metrics.ordersProcessed += Math.floor(Math.random() * 5);
    supplyChainData.metrics.riskScore = Math.max(0, Math.min(10, supplyChainData.metrics.riskScore + Math.random() * 0.4 - 0.2));
    
    // Update route progress
    supplyChainData.routes.forEach(route => {
        if (route.status === 'active') {
            route.progress = Math.min(100, route.progress + Math.random() * 2);
            if (route.progress >= 100) {
                route.status = 'completed';
            }
        }
    });

    // Update inventory levels (simulate consumption)
    supplyChainData.inventory.forEach(item => {
        if (Math.random() < 0.3) { // 30% chance of consumption
            item.current = Math.max(0, item.current - Math.floor(Math.random() * 10));
            item.status = item.current < item.threshold * 0.5 ? 'critical' : 
                         item.current < item.threshold ? 'low' : 'optimal';
        }
    });

    // Broadcast updates
    broadcastUpdate({ type: 'metrics_update', data: supplyChainData.metrics });
}, 5000); // Update every 5 seconds

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`🚀 Autonomous Supply Chain AI Server running on port ${PORT}`);
    console.log(`📊 WebSocket server ready for real-time updates`);
    console.log(`🤖 Gemini AI integration ${process.env.GEMINI_API_KEY ? 'active' : 'inactive'}`);
});

module.exports = app;
```

## package.json for Backend
```json
{
  "name": "autonomous-supply-chain-backend",
  "version": "1.0.0",
  "description": "Backend server for Autonomous Supply Chain Rescue AI",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "jest"
  },
  "keywords": [
    "supply-chain",
    "ai",
    "automation",
    "inventory",
    "logistics"
  ],
  "author": "Supply Chain AI Team",
  "license": "MIT",
  "dependencies": {
    "@google/generative-ai": "^0.15.0",
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "ws": "^8.14.2",
    "dotenv": "^16.3.1",
    "helmet": "^7.1.0",
    "rate-limiter-flexible": "^3.0.8",
    "winston": "^3.11.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.1",
    "jest": "^29.7.0",
    "supertest": "^6.3.3"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

## .env.example
```env
# Gemini AI Configuration
GEMINI_API_KEY=your_gemini_api_key_here

# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration (if using a database)
DATABASE_URL=mongodb://localhost:27017/supply-chain-ai

# Security
JWT_SECRET=your_jwt_secret_here
CORS_ORIGIN=http://localhost:3000

# External APIs
WEATHER_API_KEY=your_weather_api_key
MAPS_API_KEY=your_maps_api_key
```

## Database Schema (MongoDB/Mongoose)
```javascript
// models/Inventory.js
const mongoose = require('mongoose');

const InventorySchema = new mongoose.Schema({
    item: {
        type: String,
        required: true,
        unique: true
    },
    current: {
        type: Number,
        required: true,
        min: 0
    },
    threshold: {
        type: Number,
        required: true,
        min: 0
    },
    predicted: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['optimal', 'low', 'critical'],
        required: true
    },
    category: String,
    unit: String,
    cost: Number,
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    history: [{
        date: Date,
        level: Number,
        action: String
    }]
});

module.exports = mongoose.model('Inventory', InventorySchema);

// models/Supplier.js
const mongoose = require('mongoose');

const SupplierSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        min: 0,
        max: 5,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    products: [{
        type: String,
        required: true
    }],
    leadTime: {
        type: Number,
        required: true,
        min: 1
    },
    reliability: {
        type: Number,
        min: 0,
        max: 100,
        required: true
    },
    negotiationStatus: {
        type: String,
        enum: ['active', 'pending', 'completed', 'failed'],
        default: 'pending'
    },
    contracts: [{
        startDate: Date,
        endDate: Date,
        terms: Object,
        value: Number
    }],
    performance: [{
        date: Date,
        metric: String,
        value: Number
    }]
});

module.exports = mongoose.model('Supplier', SupplierSchema);
```

## Additional Utilities
```javascript
// utils/aiPrompts.js
const AI_PROMPTS = {
    demandForecast: (item, historicalData) => `
        Analyze demand patterns for ${item} based on this historical data:
        ${JSON.stringify(historicalData)}
        
        Provide a 30-day demand forecast considering:
        - Seasonal trends
        - Market conditions
        - Economic factors
        - Supply chain disruptions
        
        Format response as JSON with daily predictions.
    `,
    
    supplierNegotiation: (supplier, terms) => `
        As an AI negotiation expert, analyze this supplier negotiation:
        Supplier: ${supplier.name}
        Terms: ${JSON.stringify(terms)}
        
        Provide negotiation strategy and expected outcomes.
    `,
    
    riskAssessment: (supplyChainData) => `
        Assess supply chain risks based on current data:
        ${JSON.stringify(supplyChainData)}
        
        Identify top 5 risks and mitigation strategies.
    `
};

module.exports = AI_PROMPTS;

// utils/dataGenerator.js
function generateRealtimeData() {
    return {
        timestamp: new Date().toISOString(),
        metrics: {
            ordersProcessed: Math.floor(Math.random() * 100) + 50,
            averageDeliveryTime: Math.random() * 5 + 10,
            costSavings: Math.random() * 20 + 5,
            riskScore: Math.random() * 10,
            automationLevel: Math.random() * 10 + 85
        },
        alerts: generateRandomAlerts(),
        inventoryChanges: generateInventoryChanges()
    };
}

function generateRandomAlerts() {
    const alertTypes = ['critical', 'warning', 'success', 'info'];
    const messages = [
        'Inventory threshold reached',
        'Supplier delivery delayed',
        'Route optimization completed',
        'New supplier contract signed',
        'Weather disruption detected'
    ];
    
    return Array.from({ length: Math.floor(Math.random() * 3) }, () => ({
        type: alertTypes[Math.floor(Math.random() * alertTypes.length)],
        message: messages[Math.floor(Math.random() * messages.length)],
        time: new Date().toISOString(),
        priority: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)]
    }));
}

module.exports = { generateRealtimeData };
```