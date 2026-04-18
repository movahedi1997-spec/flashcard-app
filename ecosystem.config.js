module.exports = {
  apps: [{
    name: 'flashcard-app',
    script: 'node_modules/.bin/next',
    args: 'start',
    cwd: '/home/appuser/app',
    exec_mode: 'fork',
    instances: 1,
    kill_timeout: 15000,
    wait_ready: false,
    autorestart: true,
    exp_backoff_restart_delay: 2000,
    env: {
      NODE_ENV: 'production',
    },
  }]
};
