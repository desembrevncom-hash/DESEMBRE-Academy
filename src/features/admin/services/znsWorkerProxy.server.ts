import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getZnsHubHealthProxy = createServerFn({ method: "GET" })
  .handler(async () => {
    const hubApiUrl = process.env['HUB_API_URL'] || "";
    if (!hubApiUrl) {
      return null;
    }
    try {
      const res = await fetch(`${hubApiUrl}/api/zalo/outbox/health`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  });

export const processZnsOutboxProxy = createServerFn({ method: "POST" })
  .validator(z.object({
    mode: z.enum(["simulate", "real"]).default("simulate"),
    limit: z.number().optional().default(5)
  }))
  .handler(async ({ data: { mode, limit } }) => {
    const hubApiUrl = process.env['HUB_API_URL'] || "";
    const hubWorkerSecret = process.env['HUB_WORKER_SECRET'] || "";

    if (!hubApiUrl || !hubWorkerSecret) {
      throw new Error("Academy server cần HUB_API_URL và HUB_WORKER_SECRET trong .env. Restart npm run dev sau khi thêm env.");
    }

    const endpoint = `${hubApiUrl}/api/zalo/outbox/process`;

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-hub-worker-secret": hubWorkerSecret
        },
        body: JSON.stringify({ mode, limit })
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.missing) {
          throw new Error(JSON.stringify({ error: data.error, missing: data.missing }));
        }
        throw new Error(data.error || "Lỗi gọi Hub API");
      }

      return data;
    } catch (error: any) {
      console.error("[ZNS Proxy Error]", error);
      throw new Error(error.message || "Failed to process ZNS outbox via Hub");
    }
  });
