module.exports = {
  apps: [{
    name: 'flashcard-app',
    script: 'node_modules/.bin/next',
    args: 'start',
    cwd: '/home/appuser/app',
    interpreter: 'node',
    exec_mode: 'fork',
    instances: 1,
    kill_timeout: 5000,
    autorestart: true,
    env: {
      NODE_ENV: 'production',
    },
  }]
};
