import fs from "fs";
import path from "path";

import { lookupFile } from "../utils/global.js";
import { ProjectConfigFileName } from "../constants/index.js";
import { generateProjectDirsConfig } from "./generateProjectDirsConfig.js";
import { ProjectConfigExtend } from "../types/config.js";
import { defineConfig } from "./defineConfig.js";
import { transformRunTs } from "../utils/transformRunTs.js";

let getConfigCache: Promise<ProjectConfigExtend> | null = null;

export async function getConfig() {
  if (!getConfigCache) {
    getConfigCache = new Promise(async (resolve) => {
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
      resolve({
        ...projectConfig,
        dirs,
        appSyncHandleNumber: projectConfig.appSyncHandleNumber || 3,
      });
    });
  }
  return getConfigCache;
}
