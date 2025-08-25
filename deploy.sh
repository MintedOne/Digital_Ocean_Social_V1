#!/bin/bash

# Digital Ocean Deployment Script
SERVER="social-media-do"
REMOTE_DIR="/root/social-media-manager"

echo "🚀 Starting deployment to Digital Ocean..."

# Create remote directory
echo "📁 Creating remote directory..."
ssh $SERVER "mkdir -p $REMOTE_DIR"

# Copy application files (excluding node_modules and other unnecessary files)
echo "📦 Uploading application files..."
rsync -avz --exclude='node_modules' \
    --exclude='.git' \
    --exclude='.next' \
    --exclude='temp' \
    --exclude='*.log' \
    --exclude='deploy.sh' \
    --exclude='AI Vault One' \
    ./ $SERVER:$REMOTE_DIR/

# Copy environment file
echo "🔐 Uploading environment configuration..."
scp .env.local $SERVER:$REMOTE_DIR/.env.local

# Install dependencies and build on server
echo "📦 Installing dependencies..."
ssh $SERVER "cd $REMOTE_DIR && npm install"

echo "🔨 Building application..."
ssh $SERVER "cd $REMOTE_DIR && npm run build"

# Start application with PM2
echo "🎯 Starting application with PM2..."
ssh $SERVER "cd $REMOTE_DIR && pm2 delete social-media-manager 2>/dev/null || true"
ssh $SERVER "cd $REMOTE_DIR && PORT=3000 pm2 start npm --name social-media-manager -- start"
ssh $SERVER "pm2 save"
ssh $SERVER "pm2 startup systemd -u root --hp /root"

echo "✅ Deployment complete!"
echo "🌐 Your application is running at: http://142.93.52.214:3000"
echo ""
echo "📝 Useful commands:"
echo "  View logs: ssh $SERVER 'pm2 logs social-media-manager'"
echo "  Restart app: ssh $SERVER 'pm2 restart social-media-manager'"
echo "  Stop app: ssh $SERVER 'pm2 stop social-media-manager'"
echo "  Monitor: ssh $SERVER 'pm2 monit'"