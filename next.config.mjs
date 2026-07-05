/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  distDir: process.env.NEXT_DIST_DIR || '.next',
  reactCompiler: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
