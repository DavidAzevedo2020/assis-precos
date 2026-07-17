import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Planilhas anexadas às solicitações de cotação por e-mail podem passar
      // do limite padrão de 1MB.
      bodySizeLimit: "5mb",
    },
  },
};

export default nextConfig;
