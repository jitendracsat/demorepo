import type { NextConfig } from "next";

const nextConfig: NextConfig = {
 
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  

  async rewrites() {
    return [
      {
        // Jab React yahan API hit karega...
        source: '/api/csat/:path*',
        // ...toh Next.js chupke se data yahan se le aayega
        destination: 'http://apiconnectnow.csatspl.com/api/:path*',
      },
    ];
  },
};

export default nextConfig;