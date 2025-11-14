import fs from "fs";
import path from "path";
import { ProjectConfigExtend } from "../types/config.js";

export function generateProjectDirsConfig(rootDir: string): ProjectConfigExtend["dirs"] {
  const packagesDir = getPackagesDir(rootDir);
  const corePackageDir = getCorePackageDir(packagesDir);
  const appPackageDir = getAppPackageDir(packagesDir);
  const scriptsDir = getScriptPackageDir(packagesDir);
  const logsDir = getLogDir(rootDir);

  return {
    rootDir,
    packagesDir,
    corePackageDir,
    appPackageDir,
    scriptsDir,
    logsDir,
  };
}

function getPackagesDir(rootDir: string) {
  return path.join(rootDir, "./packages");
}

function getCorePackageDir(packagesDir: string) {
  return path.join(packagesDir, "./core");
}

function getAppPackageDir(packagesDir: string) {
  return path.join(packagesDir, "./app");
}

function getScriptPackageDir(packagesDir: string) {
  return path.join(packagesDir, "./script");
}

function getLogDir(rootDir: string) {
  const logDir = path.join(rootDir, "./log");
  if (!fs.statSync(logDir, { throwIfNoEntry: false })?.isDirectory()) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  return logDir;
}
