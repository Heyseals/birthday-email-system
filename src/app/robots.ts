import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/privacy", "/join"],
      disallow: [
        "/admin",
        "/login",
        "/confirm",
        "/manage",
        "/unsubscribe",
        "/api/",
      ],
    },
  };
}
