/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimize for development performance
  swcMinify: true,
  
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "replicate.com",
      },
      {
        protocol: "https",
        hostname: "replicate.delivery",
      },
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
    ],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  
  // Webpack optimizations for development
  webpack: (config, { dev, isServer }) => {
    // Fix FFmpeg webpack compilation issues
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
    };
    
    // Exclude problematic FFmpeg modules from webpack processing
    config.externals = config.externals || [];
    config.externals.push({
      '@ffmpeg/ffmpeg': '@ffmpeg/ffmpeg',
      '@ffmpeg/util': '@ffmpeg/util',
    });
    
    if (dev && !isServer) {
      // Reduce memory usage in development
      config.optimization.splitChunks = {
        chunks: 'all',
        maxSize: 200000,
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      };
    }
    return config;
  },
};

export default nextConfig;
