module.exports = {
  apps: [{
    name: 'flashcard-app',
    script: 'start.sh',
    cwd: '/home/appuser/app',
    exec_mode: 'fork',
    instances: 1,
    kill_timeout: 10000,
    autorestart: true,
    exp_backoff_restart_delay: 1000,
    env: {
      NODE_ENV: 'production',
    },
  }]
};
