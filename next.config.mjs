/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "nukkfseqvufkznyvftdb.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  // Transpile emoji-mart packages for Next.js compatibility
  transpilePackages: ["@emoji-mart/react", "@emoji-mart/data"],
};

export default nextConfig;
