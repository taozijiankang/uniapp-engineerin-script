import fs from "fs";
import path from "path";
import { ProjectConfigExtend } from "../types/config.js";

export function generateProjectDirsConfig(rootDir: string): ProjectConfigExtend["dirs"] {
  const packagesDir = getPackagesDir(rootDir);
  const logsDir = getLogDir(rootDir);
  const corePackageDir = getCorePackageDir(packagesDir);
  const appShellsDir = getAppShellsDir(packagesDir);

  if (!fs.statSync(appShellsDir, { throwIfNoEntry: false })?.isDirectory()) {
    throw new Error(`app-shells 目录不存在: ${appShellsDir}`);
  }

  if (!fs.statSync(corePackageDir, { throwIfNoEntry: false })?.isDirectory()) {
    throw new Error(`core 目录不存在: ${corePackageDir}`);
  }

  return {
    rootDir,
    packagesDir,
    corePackageDir,
    appShellsDir,
    logsDir,
  };
}

function getPackagesDir(rootDir: string) {
  return path.join(rootDir, "./packages");
}

function getCorePackageDir(packagesDir: string) {
  return path.join(packagesDir, "./core");
}

function getAppShellsDir(packagesDir: string) {
  return path.join(packagesDir, "./app-shells");
}

function getLogDir(rootDir: string) {
  const logDir = path.join(rootDir, "./log");
  if (!fs.statSync(logDir, { throwIfNoEntry: false })?.isDirectory()) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  return logDir;
}
