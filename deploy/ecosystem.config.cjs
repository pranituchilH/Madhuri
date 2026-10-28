// PM2 process file used on the server: pm2 startOrReload deploy/ecosystem.config.cjs
const path = require('path');
const root = path.join(__dirname, '..');

module.exports = {
  apps: [
    {
      name: 'madhuri-api',
      cwd: path.join(root, 'backend'),
      script: 'src/server.js',
      env: { NODE_ENV: 'production' },
      max_memory_restart: '400M',
    },
    {
      name: 'madhuri-web',
      cwd: path.join(root, 'frontend'),
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000 -H 127.0.0.1',
      env: { NODE_ENV: 'production' },
      max_memory_restart: '600M',
    },
  ],
};
