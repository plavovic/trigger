import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const backend = process.env.API_BACKEND_URL;
    if (!backend) {
      if (process.env.NODE_ENV === "production") throw new Error("API_BACKEND_URL is required for production builds");
      return [];
    }
    const url = new URL(backend);
    if (!["http:", "https:"].includes(url.protocol)) throw new Error("API_BACKEND_URL must use HTTP or HTTPS");
    if (process.env.VERCEL === "1" && (url.protocol !== "https:" || ["localhost", "127.0.0.1"].includes(url.hostname))) throw new Error("Vercel deployments require a public HTTPS API origin");
    if (url.username || url.password || url.search || url.hash || url.pathname !== "/") throw new Error("API_BACKEND_URL must be a plain origin");
    if (process.env.NODE_ENV === "production" && url.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(url.hostname)) throw new Error("Production API must use HTTPS");
    return [{ source: "/api/:path*", destination: `${url.origin}/api/:path*` }];
  },
};

export default nextConfig;
