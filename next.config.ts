import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

import { baseHeaders, contentSecurityPolicy, IDX_PATHS } from "./security-headers.mjs";

const dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // WordPress-style trailing slashes on public pages; src/proxy.ts adds them, so the
  // built-in redirect is skipped and the admin/API keep their own URLs.
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  experimental: {
    // One 404 page for URLs that match no route (the site and admin have separate layouts).
    globalNotFound: true,
  },
  poweredByHeader: false,
  // Page bodies are read from disk at request time; ship them with the server functions.
  outputFileTracingIncludes: { "/**": ["./src/content/pages/*.html"] },
  async headers() {
    return [
      { source: "/:path*", headers: baseHeaders },
      // The Payload admin manages its own scripts; the CSP covers the public site. The OAuth
      // sign-in pages set their own (their form must be allowed to return to the app).
      { source: "/((?!admin|api|oauth/).*)", headers: [{ key: "Content-Security-Policy", value: contentSecurityPolicy() }] },
      // Buying Buddy pages: same policy plus 'unsafe-eval' (later rules override earlier ones).
      ...IDX_PATHS.map((p) => ({
        source: `${p}{/}?`,
        headers: [{ key: "Content-Security-Policy", value: contentSecurityPolicy({ idx: true }) }],
      })),
    ];
  },
  images: {
    localPatterns: [{ pathname: "/api/media/file/**" }],
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      ".cjs": [".cts", ".cjs"],
      ".js": [".ts", ".tsx", ".js", ".jsx"],
      ".mjs": [".mts", ".mjs"],
    };
    return webpackConfig;
  },
  turbopack: {
    root: path.resolve(dirname),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default withPayload(nextConfig, { devBundleServerPackages: false });
