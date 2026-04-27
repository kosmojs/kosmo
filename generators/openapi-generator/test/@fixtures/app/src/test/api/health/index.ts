import { defineRoute } from "@test/index";

type MemoryUsage = {
  rss: number;
  heapTotal: number;
  heapUsed: number;
  external: number;
  arrayBuffers: number;
};

type HealthStatus = {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  uptime: number;
  memory: MemoryUsage;
};

export default defineRoute(({ GET }) => [
  GET<
    { response: [200, "json", HealthStatus] },
    {
      response: {
        runtimeValidation: false;
      };
    }
  >(async (ctx) => {
    const memory = process.memoryUsage();
    ctx.body = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        rss: memory.rss,
        heapTotal: memory.heapTotal,
        heapUsed: memory.heapUsed,
        external: memory.external,
        arrayBuffers: memory.arrayBuffers,
      },
    };
  }),
]);
