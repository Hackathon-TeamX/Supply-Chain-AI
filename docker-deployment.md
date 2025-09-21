# 🐳 Docker Configuration & Production Deployment

## Docker Setup

### Dockerfile for Backend
```dockerfile
# Use official Node.js runtime as the base image
FROM node:18-alpine

# Set working directory inside container
WORKDIR /app

# Copy package files first (for better caching)
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy application source code
COPY . .

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose the port the app runs on
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Start the application
CMD ["node", "server.js"]
```

### Docker Compose Configuration
```yaml
# docker-compose.yml
version: '3.8'

services:
  # Frontend service
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:80"
    depends_on:
      - backend
    environment:
      - REACT_APP_API_URL=http://backend:3001
    volumes:
      - ./frontend/src:/app/src
      - ./frontend/public:/app/public
    networks:
      - supply-chain-network

  # Backend service
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    volumes:
      - ./backend:/app
      - /app/node_modules
    depends_on:
      - redis
      - mongodb
    networks:
      - supply-chain-network
    restart: unless-stopped

  # Redis for caching and sessions
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - supply-chain-network
    restart: unless-stopped

  # MongoDB for persistent data
  mongodb:
    image: mongo:6
    ports:
      - "27017:27017"
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=${MONGO_PASSWORD}
      - MONGO_INITDB_DATABASE=supplychain
    volumes:
      - mongodb_data:/data/db
      - ./mongo-init.js:/docker-entrypoint-initdb.d/mongo-init.js:ro
    networks:
      - supply-chain-network
    restart: unless-stopped

  # Nginx reverse proxy
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/ssl/certs
    depends_on:
      - frontend
      - backend
    networks:
      - supply-chain-network
    restart: unless-stopped

# Named volumes for data persistence
volumes:
  mongodb_data:
  redis_data:

# Network configuration
networks:
  supply-chain-network:
    driver: bridge
```

### Frontend Dockerfile
```dockerfile
# Multi-stage build for frontend
FROM node:18-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Nginx Configuration
```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;

    # Upstream backend servers
    upstream backend {
        server backend:3001;
    }

    # Frontend server
    server {
        listen 80;
        server_name localhost;

        # Serve static files
        location / {
            root /usr/share/nginx/html;
            index index.html index.htm;
            try_files $uri $uri/ /index.html;

            # Cache static assets
            location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
                expires 1y;
                add_header Cache-Control "public, immutable";
            }
        }

        # Proxy API requests to backend
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;

            # CORS headers
            add_header Access-Control-Allow-Origin *;
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range";
        }

        # WebSocket proxy
        location /ws {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "Upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }

    # HTTPS configuration (uncomment for SSL)
    # server {
    #     listen 443 ssl http2;
    #     server_name your-domain.com;

    #     ssl_certificate /etc/ssl/certs/fullchain.pem;
    #     ssl_certificate_key /etc/ssl/certs/privkey.pem;
    #     ssl_protocols TLSv1.2 TLSv1.3;
    #     ssl_ciphers HIGH:!aNULL:!MD5;

    #     location / {
    #         root /usr/share/nginx/html;
    #         index index.html index.htm;
    #         try_files $uri $uri/ /index.html;
    #     }

    #     location /api/ {
    #         proxy_pass http://backend;
    #         # ... same proxy settings as above
    #     }
    # }
}
```

## 🚀 Production Deployment Commands

### Local Docker Development
```bash
# Build and run all services
docker-compose up --build

# Run in detached mode
docker-compose up -d

# View logs
docker-compose logs -f backend

# Scale services
docker-compose up --scale backend=3

# Stop all services
docker-compose down

# Clean up
docker-compose down -v --rmi all
```

### Environment Setup
```bash
# Create .env file for production
cat > .env << EOF
NODE_ENV=production
GEMINI_API_KEY=your_production_gemini_key
DATABASE_URL=mongodb://admin:password@mongodb:27017/supplychain?authSource=admin
REDIS_URL=redis://redis:6379
MONGO_PASSWORD=your_secure_mongo_password
JWT_SECRET=your_production_jwt_secret
CORS_ORIGIN=https://your-domain.com
EOF
```

## ☁️ Cloud Deployment Options

### AWS ECS Deployment
```yaml
# ecs-task-definition.json
{
  "family": "supply-chain-ai",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::account:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "supply-chain-backend",
      "image": "your-registry/supply-chain-backend:latest",
      "portMappings": [
        {
          "containerPort": 3001,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "PORT",
          "value": "3001"
        }
      ],
      "secrets": [
        {
          "name": "GEMINI_API_KEY",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:supply-chain/gemini-api-key"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/supply-chain-ai",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

### Kubernetes Deployment
```yaml
# k8s-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: supply-chain-backend
  labels:
    app: supply-chain-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: supply-chain-backend
  template:
    metadata:
      labels:
        app: supply-chain-backend
    spec:
      containers:
      - name: backend
        image: supply-chain-backend:latest
        ports:
        - containerPort: 3001
        env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "3001"
        - name: GEMINI_API_KEY
          valueFrom:
            secretKeyRef:
              name: supply-chain-secrets
              key: gemini-api-key
        resources:
          limits:
            cpu: 500m
            memory: 512Mi
          requests:
            cpu: 250m
            memory: 256Mi
        livenessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3001
          initialDelaySeconds: 5
          periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: supply-chain-backend-service
spec:
  selector:
    app: supply-chain-backend
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3001
  type: LoadBalancer

---
apiVersion: v1
kind: Secret
metadata:
  name: supply-chain-secrets
type: Opaque
data:
  gemini-api-key: <base64-encoded-api-key>
  jwt-secret: <base64-encoded-jwt-secret>
```

### DigitalOcean App Platform
```yaml
# .do/app.yaml
name: supply-chain-ai
services:
- name: backend
  source_dir: /backend
  github:
    repo: your-username/supply-chain-ai
    branch: main
  run_command: node server.js
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: NODE_ENV
    value: production
  - key: PORT
    value: "8080"
  - key: GEMINI_API_KEY
    value: YOUR_GEMINI_API_KEY
    type: SECRET
  http_port: 8080
  routes:
  - path: /api
  - path: /ws

- name: frontend
  source_dir: /frontend
  github:
    repo: your-username/supply-chain-ai
    branch: main
  build_command: npm run build
  run_command: npm start
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  routes:
  - path: /

databases:
- name: supply-chain-db
  engine: MONGODB
  version: "4.4"
```

## 🔧 Production Optimizations

### Backend Performance
```javascript
// Add to server.js for production
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    cluster.fork();
  });
} else {
  // Workers can share any TCP port
  // In this case it is an HTTP server
  require('./app.js');
  console.log(`Worker ${process.pid} started`);
}
```

### Caching Strategy
```javascript
// Redis caching middleware
const Redis = require('redis');
const client = Redis.createClient(process.env.REDIS_URL);

const cacheMiddleware = (duration) => {
  return async (req, res, next) => {
    const key = req.originalUrl;
    const cached = await client.get(key);

    if (cached) {
      return res.json(JSON.parse(cached));
    }

    res.sendResponse = res.json;
    res.json = (body) => {
      client.setex(key, duration, JSON.stringify(body));
      res.sendResponse(body);
    };

    next();
  };
};

// Use caching for API routes
app.get('/api/dashboard', cacheMiddleware(30), getDashboard);
```

### Database Connection Pooling
```javascript
// MongoDB connection with pooling
const mongoose = require('mongoose');

mongoose.connect(process.env.DATABASE_URL, {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4,
  bufferCommands: false,
  bufferMaxEntries: 0
});
```

## 📊 Monitoring and Logging

### Application Monitoring
```javascript
// Add monitoring middleware
const prometheus = require('prom-client');

// Create metrics
const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code']
});

const wsConnectionsTotal = new prometheus.Gauge({
  name: 'websocket_connections_total',
  help: 'Total number of WebSocket connections'
});

// Middleware to track metrics
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestDuration
      .labels(req.method, req.route?.path || req.url, res.statusCode)
      .observe(duration);
  });
  
  next();
});

// Metrics endpoint
app.get('/metrics', (req, res) => {
  res.set('Content-Type', prometheus.register.contentType);
  res.end(prometheus.register.metrics());
});
```

### Health Checks
```javascript
// Health check endpoints
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version
  });
});

app.get('/ready', async (req, res) => {
  try {
    // Check database connection
    await mongoose.connection.db.admin().ping();
    
    // Check Redis connection
    await client.ping();
    
    res.status(200).json({
      status: 'ready',
      database: 'connected',
      cache: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      error: error.message
    });
  }
});
```

## 🔒 Security Configuration

### Helmet Security Headers
```javascript
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "ws:"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true
  }
}));
```

### Rate Limiting
```javascript
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP'
});

const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: 'Too many chat requests'
});

app.use('/api/', apiLimiter);
app.use('/api/chat', chatLimiter);
```

## 🚀 Deployment Scripts

### Build Script
```bash
#!/bin/bash
# build.sh

echo "🏗️ Building Supply Chain AI Application..."

# Build backend
echo "📦 Building backend..."
cd backend
npm ci --production
npm run test
cd ..

# Build frontend
echo "🎨 Building frontend..."
cd frontend
npm ci
npm run build
cd ..

# Build Docker images
echo "🐳 Building Docker images..."
docker build -t supply-chain-backend:latest ./backend
docker build -t supply-chain-frontend:latest ./frontend

echo "✅ Build complete!"
```

### Deployment Script
```bash
#!/bin/bash
# deploy.sh

echo "🚀 Deploying Supply Chain AI to production..."

# Check if required environment variables are set
if [ -z "$GEMINI_API_KEY" ]; then
    echo "❌ GEMINI_API_KEY is not set"
    exit 1
fi

# Pull latest code
git pull origin main

# Build application
./build.sh

# Deploy with docker-compose
echo "📦 Deploying with Docker Compose..."
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 30

# Run health checks
curl -f http://localhost/health || exit 1

echo "✅ Deployment successful!"
echo "🌐 Application available at: http://localhost"
```

This comprehensive deployment guide provides everything needed to take the Autonomous Supply Chain Rescue AI from development to production, with multiple deployment options and production-ready configurations.