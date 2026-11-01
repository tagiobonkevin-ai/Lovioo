/**
 * Old Vercel addresses for the same site. They can't be removed in Vercel, so they send visitors (and search
 * engines) to the real domain, keeping the page and any ?ref= / query. Each deployment's own unique URL and preview
 * URLs are left alone so builds can still be checked before they go live.
 */
const OLD_HOSTS = ["lovioo-kevin-2313.vercel.app", "lovioo-omega.vercel.app", "lovioo-git-main-kevin-2313.vercel.app"];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return OLD_HOSTS.map((host) => ({
      source: "/:path*",
      has: [{ type: "host", value: host }],
      destination: "https://lovioo.shop/:path*",
      permanent: true,
    }));
  },
};

export default nextConfig;
