import service from "./entry"

const close = await service.start();

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, async () => {
    await service.teardown?.();
    await close();
    process.exit(0);
  });
}
