---
title: Preview and production
description: Starting sidecars outside development - why the dispatcher never does it,
    and what running them separately looks like.
head:
  - - meta
    - name: keywords
      content: sidecar production, pm2, ecosystem.config.cjs, exec_mode fork, dist/run.js, deploy sidecar
---

Outside development nothing starts a sidecar for you - not `kosmo preview`, not `dist/run.js`.
Each one is a process you run and supervise yourself.

A sidecar running under `pnpm dev` will therefore not be running under `pnpm preview`.

In preview, and in production, start each one yourself:

```sh
node dist/mailer/sidecar/run.js
node dist/smtp/sidecar/run.js
```

That is your `run.ts`, built - not something KosmoJS wraps around it.

So whatever you already use for long-running processes -
systemd, a container command, a platform worker - applies unchanged.

Note the two `run.js` are unrelated: `dist/run.js` is the dispatcher for the HTTP folders,
while `dist/<folder>/sidecar/run.js` is one sidecar's runner.

::: info Do not fold sidecars into the main process
Nothing stops you from writing a runner that imports every HTTP folder and every sidecar and runs them in one process.
It will appear to work. It also makes the HTTP side as fragile as the job:

- an unhandled rejection in a consumer takes the process down, and every route  with it
- a CPU-bound job blocks the event loop, so requests queue behind work that has nothing to do with them
- the two scale in opposite directions - a queue backlog wants more workers, more traffic wants more web - and one process gives you one dial
- restarting the web tier to deploy a route change restarts whatever the job was halfway through

Deploy and run sidecars as their own processes.
That is the whole reason the build emits them separately.
:::

Folders build together and run apart. A process manager is what makes that safe.

Here is a [PM2](https://github.com/Unitech/pm2) example - one build, three processes:

```js [ecosystem.config.cjs]
module.exports = {
  apps: [
    {
      name: "web",
      script: "dist/run.js",
      args: "-p 4556",
      exec_mode: "cluster",
      instances: "max",
    },
    {
      name: "mailer",
      script: "dist/mailer/sidecar/run.js",
      exec_mode: "fork",
    },
    {
      name: "smtp",
      script: "dist/smtp/sidecar/run.js",
      exec_mode: "fork",
    },
  ],
};
```

```sh
pm2 start ecosystem.config.cjs
pm2 reload web          # ship a route change without touching the jobs
pm2 logs smtp
```

`exec_mode: "fork"` on the sidecars is the part worth keeping.

Clustering suits `dist/run.js`: requests are independent, so more workers means more throughput.
A sidecar is not like that.

- one holding a port cannot bind it twice
- a queue consumer handles every message once per worker, unless the queue hands out leases

Scale those deliberately, never with `max`.

Watch which key does it, too. Setting `instances` at all moves an app to cluster mode,
so a sidecar wants fork named explicitly, or neither key - fork is the default.

`pm2 reload` and `pm2 stop` send `SIGINT`,
which is what the [runner](/sidecar/entry#the-runner) catches -
so in-flight work drains through your close function instead of being cut off.
