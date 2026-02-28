/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: [
    'http://localhost:3000',
    'https://localhost:3000',
    'http://localhost:5000',
    'https://localhost:5000',
    'http://192.168.1.33:3000',
    'http://192.168.1.33:5000',
    'https://686dffq3-3000.inc1.devtunnels.ms',
    'https://686dffq3-5000.inc1.devtunnels.ms',
  ],
};

export default nextConfig;
