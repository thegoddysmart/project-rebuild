import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/auth/", "/dashboard/"], // Disallow private areas
    },
    sitemap: "https://easevote.com/sitemap.xml",
  };
}
