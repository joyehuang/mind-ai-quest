module.exports = {
  apps: [
    {
      name: "mind-ai-quest-frontend",
      script: "npm",
      args: "start",
      cwd: "/root/mind-ai-quest",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3000
      }
    },
    {
      name: "mind-ai-quest-backend",
      script: "app.py",
      interpreter: "/usr/bin/python3.8",
      cwd: "/root/mind-ai-quest",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        PYTHONUNBUFFERED: "1"
      }
    }
  ]
};
