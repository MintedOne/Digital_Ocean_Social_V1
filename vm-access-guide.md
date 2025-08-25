# 🖥️ Digital Ocean VM Access Guide

## SSH Access (Terminal)
```bash
# Direct SSH access
ssh root@142.93.52.214

# Or using the SSH config we created
ssh social-media-do
```

## Web-Based Console
1. **Digital Ocean Console** (via web browser):
   - Go to: https://cloud.digitalocean.com/droplets
   - Find your "social-media-manager-v1" droplet  
   - Click "Console" button for web terminal

2. **Install Web Terminal on VM**:
```bash
# SSH into VM first
ssh social-media-do

# Install ttyd for web terminal
apt update && apt install -y ttyd

# Start web terminal on port 7681
ttyd -p 7681 bash

# Access via browser: http://142.93.52.214:7681
```

## File Management
```bash
# Browse files
ls -la /root/social-media-manager/

# Edit files  
nano /root/social-media-manager/.env.local

# Check application logs
pm2 logs social-media-manager

# Monitor resources
htop
```

## Current VM Specs
- **IP**: 142.93.52.214
- **OS**: Ubuntu 24.04 LTS
- **RAM**: 4GB  
- **CPU**: 2 vCPUs
- **Storage**: 50GB SSD
- **Region**: NYC1 (New York)