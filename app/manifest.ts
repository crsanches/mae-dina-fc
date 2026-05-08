import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mãe Diná FC",
    short_name: "Mãe Diná FC",
    description: "O bolão mais caótico da Copa 😎",
    start_url: "/",
    display: "standalone",
    background_color: "#09090b",
    theme_color: "#22c55e",
    icons: [
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}