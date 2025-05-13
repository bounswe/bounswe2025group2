import type { Express } from "express";
import { createServer, type Server } from "http";
import { createProxyMiddleware } from "http-proxy-middleware";
import type { IncomingMessage, ServerResponse } from "http";
import {API_BASE_URL} from "@/lib/queryClient.ts";

const DJANGO_BACKEND_URL = API_BASE_URL;

export async function registerRoutes(app: Express): Promise<Server> {
    // Proxy all /api requests to Django backend
    app.use(
        "/api",
        createProxyMiddleware({
            target: DJANGO_BACKEND_URL,
            changeOrigin: true,
            secure: false,
            pathRewrite: {
                "^/api": "/api"  // Keep /api prefix when forwarding to Django
            },
            onProxyRes: function(proxyRes: IncomingMessage) {
                // Ensure cookies are properly handled
                if (proxyRes.headers['set-cookie']) {
                    const cookies = proxyRes.headers['set-cookie'].map((cookie: string) =>
                        cookie.replace(/; secure/gi, '')
                    );
                    proxyRes.headers['set-cookie'] = cookies;
                }
            }
        } as any)  // Type assertion needed due to http-proxy-middleware types limitation
    );

    const httpServer = createServer(app);
    return httpServer;
}