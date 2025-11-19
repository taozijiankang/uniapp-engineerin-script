import fs from "fs";
import { glob } from "glob";
import path from "path";

import { chunkArray, hasDir, hasFile } from "../utils/global.js";
import { isWindows } from "../utils/is.js";
import { AppConfigExtend, ProjectConfigExtend } from "../types/config.js";
import { AppPackConfigFilePath } from "../constants/index.js";

export async function createApps(
  appsConfig: AppConfigExtend[],
  op: {
    appShellsDir: string;
    appSyncHandleNumber: number;
    appEnvKeyDicts: ProjectConfigExtend["appEnvKeyDicts"];
    distributionApp: ProjectConfigExtend["distributionApp"];
    opAppConfig: ProjectConfigExtend["app"];
  }
) {
  const { appShellsDir, appSyncHandleNumber, appEnvKeyDicts, distributionApp, opAppConfig } = op;

  const getAppShellDir = (appConfig: AppConfigExtend) => {
    const p = path.join(appShellsDir, appConfig.uniappShellType);
    if (!fs.statSync(p, { throwIfNoEntry: false })?.isDirectory()) {
      throw new Error(`app-shell 目录不存在: ${p}`);
    }
    return p;
  };

  const linkDirs = ["src/TUICallKit-Wechat", "src/TUICallKit-Vue", "src/uni_modules"];

  for (const groupsApp of chunkArray(appsConfig, appSyncHandleNumber)) {
    await Promise.all(
      groupsApp.map(async (appConfig) => {
        const appShellDir = getAppShellDir(appConfig);

        // 复制公共文件
        const appFiles = await glob("**", {
          cwd: appShellDir,
          ignore: ["node_modules/**", "dist/**", ...linkDirs.map((item) => `${item}/**`)],
          dot: true,
          nodir: true,
        });

        await Promise.all(
          appFiles.map(async (item) => {
            const sourceFilePath = path.join(appShellDir, item);
            const targetFilePath = path.join(appConfig.path, item);
            try {
              await fs.promises.mkdir(path.dirname(targetFilePath), {
                recursive: true,
              });
            } catch {}
            let buffer = await fs.promises.readFile(sourceFilePath);
            for (const loader of distributionApp?.loaders || []) {
              if (typeof loader.rules === "function" ? loader.rules(item) : loader.rules.test(item)) {
                buffer = Buffer.from(await loader.handler(sourceFilePath.replace(/\\/g, "/"), appConfig, buffer));
              }
            }
            await fs.promises.writeFile(targetFilePath, buffer);
          })
        );
      })
    );
  }

  /**
   * 生成 动态文件
   */
  for (const groupsApp of chunkArray(appsConfig, appSyncHandleNumber)) {
    await Promise.all(
      groupsApp.map(async (appConfig) => {
        const appShellDir = getAppShellDir(appConfig);

        await Promise.all([
          /**
           * 生成 .env 文件
           */
          (async () => {
            for (let env of appConfig.envs || []) {
              await fs.promises.writeFile(
                path.join(appConfig.path, `.env.${env.name}`),
                getEnvStr(
                  {
                    ...appConfig.comEnv,
                    ...env.value,
                  },
                  appEnvKeyDicts
                )
              );
            }
          })(),
          /**
           * 生成 package.json
           */
          (async () => {
            const appPackageJsonPath = path.join(appConfig.path, "package.json");
            const temPackageJsonPath = path.join(appShellDir, "package.json");
            const temPackageJson = JSON.parse((await fs.promises.readFile(temPackageJsonPath)).toString());
            let version = temPackageJson.version || "1.0.0";
            if (await hasFile(path.join(appConfig.path, "package.json"))) {
              try {
                const packageJson = JSON.parse(fs.readFileSync(path.join(appConfig.path, "package.json")).toString());
                version = packageJson.version || version;
              } catch {}
            }
            temPackageJson.version = version;
            temPackageJson.name = appConfig.packageName;
            temPackageJson.description = appConfig.description;
            temPackageJson.scripts = (await distributionApp?.getAppScripts?.(appConfig)) || {};
            await fs.promises.writeFile(appPackageJsonPath, JSON.stringify(temPackageJson, null, 2) + "\n");
          })(),
          /**
           * 生成 app pack 配置文件
           */
          (async () => {
            if (!!opAppConfig) {
              const appPackConfig = await Promise.resolve(opAppConfig.getPackConfig(appConfig));

              appPackConfig.project = appConfig.path.replace(/\\/g, "/");

              fs.writeFileSync(path.join(appConfig.path, AppPackConfigFilePath), JSON.stringify(appPackConfig, null, 2));
            }
          })(),
          /**
           * 创建符号链接
           */
          (async () => {
            for (const pathName of linkDirs) {
              const toPath = path.join(appConfig.path, pathName);
              const fromPath = path.join(appShellDir, pathName);
              if (!(await hasDir(fromPath))) {
                continue;
              }
              const lstat = await fs.promises.lstat(toPath).catch(() => null);
              const stat = await fs.promises.stat(toPath).catch(() => null);
              if (lstat?.isSymbolicLink()) {
                if ((await fs.promises.realpath(toPath)) === (await fs.promises.realpath(fromPath))) {
                  continue;
                }
                await fs.promises.unlink(toPath);
              } else if (stat?.isDirectory() || stat?.isFile()) {
                await fs.promises.rm(toPath, { recursive: true });
              }
              await fs.promises.symlink(fromPath, toPath, isWindows() ? "junction" : null);
            }
          })(),
        ]);
      })
    );
  }
}

function getEnvStr(env: Record<string, string | number | undefined>, envKeyDicts: ProjectConfigExtend["appEnvKeyDicts"] = []) {
  return Object.keys(env)
    .filter((key) => typeof env[key] != "undefined")
    .sort((a, b) => {
      const aIndex = envKeyDicts.findIndex((item) => item.value === a);
      const bIndex = envKeyDicts.findIndex((item) => item.value === b);
      return aIndex - bIndex;
    })
    .map((key) => {
      const description = envKeyDicts.find((item) => item.value === key)?.label || "";
      return `${description ? `# ${description}\n` : ""}VITE_${key} = ${env[key]}`;
    })
    .join("\n\n");
}
