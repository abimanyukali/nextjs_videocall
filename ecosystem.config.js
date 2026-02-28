module.exports = {
    apps: [
        {
            name: "signaling-server",
            script: "index.js",
            cwd: "./server",
            env: {
                NODE_ENV: "production",
                PORT: 5000,
                FRONTEND_URL: "https://your-frontend-domain.com"
            }
        },
        {
            name: "next-client",
            script: "npm",
            args: "start",
            cwd: "./client",
            env: {
                NODE_ENV: "production",
                PORT: 3000
            }
        }
    ]
};
