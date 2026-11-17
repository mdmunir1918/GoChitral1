import { spawn } from "node:child_process";
import { watch } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const schemaDirectory = path.join(root, "prisma");
const nextCli = path.join(root, "node_modules", "next", "dist", "bin", "next");
const prismaCli = path.join(root, "node_modules", "prisma", "build", "index.js");
const isWindows = process.platform === "win32";

let nextProcess;
let restartTimer;
let restarting = false;
let restartQueued = false;
let shuttingDown = false;

function run(command, args, options = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: root,
      stdio: "inherit",
      windowsHide: true,
      ...options,
    });
    child.once("error", (error) => {
      console.error(`[dev] Could not start ${command}: ${error.message}`);
      resolve(1);
    });
    child.once("exit", (code) => resolve(code ?? 1));
  });
}

async function generatePrismaClient() {
  console.log("[dev] Generating Prisma Client...");
  const code = await run(process.execPath, [prismaCli, "generate"]);
  if (code !== 0) console.error("[dev] Prisma Client generation failed; Next.js will not start with a stale client.");
  return code === 0;
}

function startNext() {
  if (shuttingDown) return;
  console.log("[dev] Starting Next.js...");
  const child = spawn(process.execPath, [nextCli, "dev", ...process.argv.slice(2)], {
    cwd: root,
    stdio: "inherit",
    windowsHide: true,
  });
  nextProcess = child;
  child.once("error", (error) => {
    console.error(`[dev] Could not start Next.js: ${error.message}`);
    nextProcess = undefined;
    process.exitCode = 1;
  });
  child.once("exit", (code) => {
    if (nextProcess === child) nextProcess = undefined;
    if (!restarting && !shuttingDown) {
      watchSchema.close();
      process.exitCode = code ?? 1;
    }
  });
}

async function stopNext() {
  const child = nextProcess;
  if (!child || child.exitCode !== null) {
    nextProcess = undefined;
    return;
  }

  if (isWindows) {
    await run("taskkill.exe", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore" });
  } else {
    child.kill("SIGTERM");
  }
  await new Promise((resolve) => {
    if (child.exitCode !== null) return resolve();
    child.once("exit", resolve);
    setTimeout(resolve, 10_000).unref();
  });
  if (nextProcess === child) nextProcess = undefined;
}

async function restartNext() {
  if (restarting || shuttingDown) return;
  restarting = true;
  try {
    do {
      restartQueued = false;
      console.log("[dev] Prisma schema changed. Restarting Next.js before regenerating the client...");
      await stopNext();
      if (shuttingDown) return;
      if (await generatePrismaClient()) startNext();
    } while (restartQueued && !shuttingDown);
  } finally {
    restarting = false;
  }
}

function queueRestart() {
  restartQueued = true;
  if (!restarting) void restartNext();
}

const watchSchema = watch(schemaDirectory, (_event, filename) => {
  if (filename && filename.toString().toLowerCase() !== "schema.prisma") return;
  clearTimeout(restartTimer);
  restartTimer = setTimeout(queueRestart, 700);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    if (shuttingDown) return;
    shuttingDown = true;
    clearTimeout(restartTimer);
    watchSchema.close();
    void stopNext().finally(() => process.exit(0));
  });
}

if (await generatePrismaClient()) startNext();
