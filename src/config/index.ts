import fs from "fs";
import path from "path";

import { lookupFile } from "../utils/global.js";
import { ProjectConfigFileName } from "../constants/index.js";
import { generateProjectDirsConfig } from "./generateProjectDirsConfig.js";
import { AppConfig, AppConfigExtend, ProjectConfigExtend } from "../types/config.js";
import { defineConfig } from "./defineConfig.js";
import { transformRunTs } from "../utils/transformRunTs.js";
import { PackageJson } from "../types/index.js";
import { Colors } from "../constants/color.js";

let getProjectConfigExtendCache: Promise<ProjectConfigExtend> | null = null;

export async function getProjectConfigExtend() {
  if (!getProjectConfigExtendCache) {
    getProjectConfigExtendCache = new Promise(async (resolve) => {
      const projectConfigPath = lookupFile(process.cwd(), [ProjectConfigFileName]);
      if (!projectConfigPath) {
        throw new Error(`在当前目录 ${process.cwd()} 和上层目录 下找不到 ${ProjectConfigFileName} 文件`);
      }
      const projectRootDir = path.dirname(projectConfigPath);

      let projectConfig: Parameters<typeof defineConfig>[0] = await transformRunTs(projectConfigPath).then((res) => res.default);

      if (typeof projectConfig === "function") {
        projectConfig = await Promise.resolve(projectConfig());
      }

      if (!path.isAbsolute(projectConfig.appsDir)) {
        projectConfig.appsDir = path.join(projectRootDir, projectConfig.appsDir);
      }

      if (!fs.statSync(projectConfig.appsDir, { throwIfNoEntry: false })?.isDirectory()) {
        fs.mkdirSync(projectConfig.appsDir, { recursive: true });
      }

      const dirs = generateProjectDirsConfig(projectRootDir);

      const apps = getApps({ rootDir: projectRootDir, appsDir: projectConfig.appsDir, apps: projectConfig.apps });

      resolve({
        ...projectConfig,
        apps,
        dirs,
        appSyncHandleNumber: projectConfig.appSyncHandleNumber || 3,
      });
    });
  }
  return getProjectConfigExtendCache;
}

function getApps(opts: { rootDir: string; appsDir: string; apps: AppConfig[] }) {
  const { rootDir, appsDir, apps } = opts;

  const projectPackage: PackageJson = JSON.parse(fs.readFileSync(path.join(rootDir, "./package.json")).toString());
  const extendApps = apps.map((item, index) => {
    const dirName = (item.dirName || "").replace(/\\/g, "/").replace(/^\/|\/$/g, "");
    const packageSecondaryName = `${dirName ? `${dirName}-` : ""}${item.name}`.replace(/\\/g, "/").replace(/\//g, "-");
    const res: AppConfigExtend = {
      ...item,
      index,
      packageName: `@${projectPackage.name}-app/${packageSecondaryName}`.toLowerCase(),
      path: path.join(appsDir, dirName, item.name),
      signColor: Colors[index] || "#f9ed69",
    };
    return res;
  });
  // 检测 apps 中是否存在重复的 packageName
  for (const packageName of extendApps.map((item) => item.packageName)) {
    const packageNameCount = extendApps.filter((item) => item.packageName === packageName).length;
    if (packageNameCount > 1) {
      throw new Error(`apps 中存在重复的 packageName，请检查 app 配置是否存在重复的 dirName/name: ${packageName}`);
    }
  }
  return extendApps;
}
