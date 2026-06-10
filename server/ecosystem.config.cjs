module.exports = {
  apps: [
    {
      name: 'sumora-chat-api',
      script: './server.js',
      instances: 'max',
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '1G',
      min_uptime: '5s',
      max_restarts: 10,
      restart_delay: 5000,
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3001,
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      kill_timeout: 30000,
      listen_timeout: 10000,
      node_args: '--max-old-space-size=1024',
    },
  ],
};
