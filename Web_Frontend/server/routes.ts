import type { Express } from "express";
import { createServer, type Server } from "http";
import { createProxyMiddleware } from "http-proxy-middleware";
import type { Request, Response } from "express";

const DJANGO_BACKEND_URL = "http://localhost:8000/api/";

export async function registerRoutes(app: Express): Promise<Server> {
    // Proxy all /api requests to Django backend
    app.use(
        "/api",
        createProxyMiddleware({
            target: DJANGO_BACKEND_URL,
            changeOrigin: true,
            secure: false,
            pathRewrite: {
            "^/api": ""
            },
        } as any)
    );

  const httpServer = createServer(app);
  return httpServer;
}