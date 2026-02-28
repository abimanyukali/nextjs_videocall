# Production Deployment Instructions

This document provides steps to deploy the Random Video Call application to a production environment.

## Prerequisites
- Node.js (v18+)
- NPM
- PM2 (`npm install -g pm2`)
- A domain with SSL (HTTPS is required for WebRTC)

## Step 1: Backend Deployment (e.g., AWS EC2)
1. Clone the repository.
2. Navigate to the `server` directory.
3. Install dependencies: `npm install --production`.
4. Create a `.env` file with production values:
   ```env
   PORT=5000
   FRONTEND_URL=https://your-frontend-domain.com
   NODE_ENV=production
   ```
5. Start the server with PM2: `pm2 start index.js --name signaling-server`.

## Step 2: Frontend Deployment (e.g., Vercel or Same Server)
1. Navigate to the `client` directory.
2. Install dependencies: `npm install`.
3. Build the application: `npm run build`.
4. If using Vercel: Connect your repository and set `NEXT_PUBLIC_SIGNAL_SERVER_URL` to your backend URL.
5. If using PM2 on the same server: `pm2 start npm --name next-client -- start`.

## Step 3: SSL Configuration
Ensure your application is served over HTTPS. You can use Nginx as a reverse proxy with Certbot (Let's Encrypt).

### Nginx Config Example
```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /socket.io/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
```

## Security Recommendations
- Update the TURN server credentials in `client/src/constants/config.ts` to use a secure, ephemeral token system if possible, or restrict IP access.
- Implement more robust rate limiting and authentication if scaling to a large user base.
