import fs from "fs";
import { glob } from "glob";
import yaml from "js-yaml";
import path from "path";
import { ProjectConfigExtend } from "../types/config.js";

/**
 * 这个函数会生成项目目录配置，同时会把项目的目录环境准备好
 * @param rootDir
 */
export function generateProjectDirsConfig(rootDir: string): ProjectConfigExtend["dirs"] {
  const appsContainerDir = getAppsContainerDir(rootDir);
  const appsDir = getAppsDir(appsContainerDir);
  const packagesDir = getPackagesDir(rootDir);
  const corePackageDir = getCorePackageDir(packagesDir);
  const appPackageDir = getAppPackageDir(packagesDir);
  const scriptsDir = getScriptPackageDir(packagesDir);
  const logsDir = getLogDir(rootDir);

  return {
    rootDir,
    appsContainerDir,
    appsDir,
    packagesDir,
    corePackageDir,
    appPackageDir,
    scriptsDir,
    logsDir,
  };
}

function getAppsContainerDir(rootDir: string) {
  const appsContainerDir = path.join(rootDir, `./build/apps-container`);
  if (!fs.statSync(appsContainerDir, { throwIfNoEntry: false })?.isDirectory()) {
    fs.mkdirSync(appsContainerDir, { recursive: true });
  }
  const handleDependencies = (dependencies: Record<string, string>): Record<string, string> => {
    return Object.fromEntries(
      Object.entries(dependencies)
        .map(([key, value]) => {
          // 直接删掉内部依赖，只保留外部依赖
          if (value === "workspace:*") {
            return [key, undefined];
          }
          return [key, value];
        })
        .filter(([key, value]) => key !== undefined && value !== undefined)
    );
  };
  /**
   * 创建pnpm环境
   * TODO: 主要是保持依赖一致，免得出些莫名其妙的问题
   */
  const pnpmWorkspaceYaml: any = yaml.load(fs.readFileSync(path.join(rootDir, `./pnpm-workspace.yaml`)).toString());
  const pnpmWorkspaces: string[] = pnpmWorkspaceYaml.packages;
  fs.writeFileSync(
    path.join(appsContainerDir, `./pnpm-workspace.yaml`),
    yaml.dump({
      packages: [...pnpmWorkspaces, "apps/*/*"],
      catalog: pnpmWorkspaceYaml.catalog,
    })
  );
  // 创建package.json
  const packageJson = JSON.parse(fs.readFileSync(path.join(rootDir, `./package.json`)).toString());
  packageJson.dependencies = handleDependencies(packageJson.dependencies || {});
  packageJson.devDependencies = handleDependencies(packageJson.devDependencies || {});
  fs.writeFileSync(path.join(appsContainerDir, `./package.json`), JSON.stringify(packageJson, null, 2));
  // 创建packages
  glob
    .sync(
      pnpmWorkspaces.map((item) => `${item}/package.json`),
      {
        cwd: rootDir,
        ignore: ["**/node_modules/**"],
      }
    )
    .forEach((item) => {
      const packageJson = JSON.parse(fs.readFileSync(path.join(rootDir, item)).toString());
      packageJson.dependencies = handleDependencies(packageJson.dependencies || {});
      packageJson.devDependencies = handleDependencies(packageJson.devDependencies || {});
      const packageJsonPath = path.join(appsContainerDir, item);
      const packageJsonDir = path.dirname(packageJsonPath);
      if (!fs.statSync(packageJsonDir, { throwIfNoEntry: false })?.isDirectory()) {
        fs.mkdirSync(packageJsonDir, { recursive: true });
      }
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    });

  return appsContainerDir;
}

function getAppsDir(appsContainerDir: string) {
  const appsDir = path.join(appsContainerDir, `./apps`);
  if (!fs.statSync(appsDir, { throwIfNoEntry: false })?.isDirectory()) {
    fs.mkdirSync(appsDir, { recursive: true });
  }
  return appsDir;
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
