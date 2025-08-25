module.exports = {
  apps: [{
    name: 'social-media-manager',
    script: 'npm',
    args: 'run dev',
    cwd: '/root/social-media-manager',
    env: {
      PORT: 3000,
      NODE_OPTIONS: '--max-old-space-size=2048'
    },
    max_memory_restart: '2G',
    restart_delay: 5000,
    // Run warmup script after app starts
    post_start: 'sleep 30 && /root/social-media-manager/warmup.sh'
  }]
};