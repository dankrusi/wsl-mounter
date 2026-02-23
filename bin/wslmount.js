#!/usr/bin/env node
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const readline = require("readline");
const { spawnSync } = require("child_process");

const ENV_KEY = "WSLMOUNT_BASE";

function isWsl() {
  return Boolean(process.env.WSL_DISTRO_NAME) || (fs.existsSync("/proc/version") && fs.readFileSync("/proc/version", "utf8").toLowerCase().includes("microsoft"));
}

function usage() {
  console.error("Usage: wslmount <subfolder-name>");
}

function normalizeBase(base) {
  if (!base) return base;
  return base.replace(/[\\/]+$/, "");
}

function joinWindowsPath(base, subfolder) {
  const cleanBase = normalizeBase(base);
  return `${cleanBase}\\${subfolder}`;
}

function getShellRcCandidates() {
  const home = os.homedir();
  return [
    path.join(home, ".bashrc"),
    path.join(home, ".zshrc"),
    path.join(home, ".profile"),
  ];
}

function appendEnvToRc(rcPath, base) {
  const exportLine = `\n# Added by wslmount\nexport ${ENV_KEY}='${base.replace(/'/g, "'\\''")}';\n`;
  fs.appendFileSync(rcPath, exportLine, "utf8");
}

async function promptForBase() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const question = (q) => new Promise((resolve) => rl.question(q, resolve));
  const answer = await question(`Enter Windows base path for mounts (e.g. C:\\Your\\Folder): `);
  rl.close();
  const trimmed = answer.trim();
  if (!trimmed) return null;
  return trimmed;
}

async function ensureBase() {
  let base = process.env[ENV_KEY];
  if (base && base.trim()) return normalizeBase(base.trim());

  const input = await promptForBase();
  if (!input) return null;
  base = normalizeBase(input);

  const candidates = getShellRcCandidates();
  let rcPath = candidates.find((p) => fs.existsSync(p));
  if (!rcPath) rcPath = candidates[0];

  try {
    appendEnvToRc(rcPath, base);
    console.log(`Saved ${ENV_KEY} to ${rcPath}`);
  } catch (err) {
    console.error(`Failed to write ${ENV_KEY} to shell rc: ${err.message}`);
  }

  return base;
}

async function main() {
  if (!isWsl()) {
    console.error("wslmount must be run inside WSL.");
    process.exit(1);
  }

  const subfolder = process.argv[2];
  if (!subfolder || subfolder.startsWith("-")) {
    usage();
    process.exit(1);
  }

  const base = await ensureBase();
  if (!base) {
    console.error("No base path provided.");
    process.exit(1);
  }

  const windowsPath = joinWindowsPath(base, subfolder);
  const mountPoint = `/mnt/${subfolder}`;

  const mkdirResult = spawnSync("sudo", ["mkdir", "-p", mountPoint], { stdio: "inherit" });
  if (mkdirResult.status !== 0) {
    process.exit(mkdirResult.status ?? 1);
  }

  const mountResult = spawnSync("sudo", ["mount", "-t", "drvfs", windowsPath, mountPoint], { stdio: "inherit" });
  if (mountResult.status !== 0) {
    process.exit(mountResult.status ?? 1);
  }
}

main().catch((err) => {
  console.error(err?.message || String(err));
  process.exit(1);
});
