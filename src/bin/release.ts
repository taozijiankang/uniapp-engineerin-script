#!/usr/bin/env node
import chalk from "chalk";
import { program } from "commander";
import dayjs from "dayjs";
import fs from "fs";
import fuzzy from "fuzzy";
import inquirer from "inquirer";
// @ts-expect-error
import CheckboxPlus from "inquirer-checkbox-plus-prompt";
import path from "path";
import { fileURLToPath } from "url";

import { Colors, FailColor, SuccessColor } from "../constants/color.js";
import {
  AppStartMode,
  ConfirmType,
  UpdateVersionNumType,
  UpdateVersionNumTypeDicts,
  AppVersionType,
  AppVersionTypeDicts,
} from "../constants/index.js";
import { packageJson } from "../packageJson.js";
import { createLog } from "../utils/createLog.js";
import { chunkArray, getQueryString, parseQueryString } from "../utils/global.js";
import { runCommand } from "../utils/runCommand.js";
import { getConfig } from "../config/index.js";
import { getApps } from "../appManage/getApps.js";
import { cleanupTempHashFolders } from "../utils/cleanupTempFolders.js";
import { createApps } from "../appManage/createApps.js";

// 注册自定义 prompt（必须）
inquirer.registerPrompt("checkbox-plus", CheckboxPlus);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ReleaseOptions {
  /** 要发布的项目，多个项目用逗号分隔 */
  apps: string;
  /** 是否发布所有项目 */
  all: string;
}

interface ReleaseApp {
  packageName: string;
  env: string;
  appVersionType: string;
  updateVersionNumType: string;
}

program
  .version(packageJson.version)
  .description("发布项目")
  .option("-s, --apps <apps>", "要发布的项目，多个项目用逗号分隔，query 参数格式：packageName=xxx&env=xxx&type=xxx&version=xxx")
  .option("-a, --all", "是否发布所有项目")
  .action(() => {
    release(program.opts());
  })
  .parse(process.argv);

async function release(args: ReleaseOptions) {
  const config = await getConfig();

  const { apps: argsApps = "", all: argsAll = false } = args;

  const releaseKey = `${dayjs().format("YYYY-MM-DD_HH-mm-ss")}`;
  const logDir = path.join(config.dirs.logsDir, releaseKey);
  try {
    fs.mkdirSync(logDir, { recursive: true });
  } catch {}

  const releaseApps: ReleaseApp[] = argsApps
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      let res = parseQueryString(item);
      return res as unknown as ReleaseApp;
    });

  const appsConfig = getApps(config);

  if (releaseApps.length <= 0) {
    const appPackageNameList = appsConfig.map((app) => ({
      value: app.packageName,
      name: `[${app.index.toString().padStart(appsConfig.length.toString().length, "0")}] ${
        app.description || app.packageName
      } @${path.relative(config.dirs.rootDir, app.path)}`,
    }));
    const { appPackageNames }: { appPackageNames: string[] } = await inquirer.prompt([
      {
        type: "checkbox-plus",
        name: "appPackageNames",
        message: `请选择要发布的项目(${appPackageNameList.length})：`,
        highlight: true,
        searchable: true,
        pageSize: 20,
        default: argsAll ? appPackageNameList.map((item) => item.value) : [],
        source: async (_: any, input: string) => {
          const m = /^(\d+)~(\d*)$/.exec(input);
          if (m) {
            let [, start = 0, end = 0] = m;
            start = Number(start || 0);
            end = Number(end || appPackageNameList.length);
            const appConfigFilter = appsConfig.filter((item) => item.index >= start && item.index <= end);
            return appPackageNameList.filter((item) => appConfigFilter.some((appConfig) => appConfig.packageName === item.value));
          } else {
            input = (input || "").trim();
            return fuzzy
              .filter(input, appPackageNameList, {
                extract: (item) => item.name,
              })
              .map((item) => item.original);
          }
        },
      },
    ]);

    if (appPackageNames.length <= 0) {
      console.log(chalk.bgHex(FailColor)(`未选择要发布的App`));
      return;
    }

    const { updateVersionNumType }: { updateVersionNumType: UpdateVersionNumType } = await inquirer.prompt([
      {
        type: "list",
        name: "updateVersionNumType",
        message: "请选择更新版本号类型：",
        default: UpdateVersionNumType.PATCH,
        choices: UpdateVersionNumTypeDicts.map((item) => ({
          value: item.value,
          name: item.label,
        })),
      },
    ]);

    console.log("创建app项目");
    await createApps(
      appsConfig.filter((item) => appPackageNames.some((packageName) => packageName === item.packageName)),
      {
        appPackageDir: config.dirs.appPackageDir,
        appSyncHandleNumber: config.appSyncHandleNumber,
        appEnvKeyDicts: config.appEnvKeyDicts,
        distributionApp: config.distributionApp,
        wxConfig: config.wx,
      }
    );

    for (const appPackageName of appPackageNames) {
      const appConfig = appsConfig.find((app) => app.packageName === appPackageName);
      if (!appConfig) {
        console.error(`未找到项目: ${appPackageName}`);
        continue;
      }
      releaseApps.push(
        ...(appConfig.release?.map((item) => ({
          packageName: appPackageName,
          env: item.env,
          appVersionType: item.type as AppVersionType,
          updateVersionNumType: updateVersionNumType,
        })) || [])
      );
    }
  } else {
    console.log("创建app项目");
    await createApps(
      appsConfig.filter((item) => releaseApps.some((apps) => apps.packageName === item.packageName)),
      {
        appPackageDir: config.dirs.appPackageDir,
        appSyncHandleNumber: config.appSyncHandleNumber,
        appEnvKeyDicts: config.appEnvKeyDicts,
        distributionApp: config.distributionApp,
        wxConfig: config.wx,
      }
    );
  }

  if (releaseApps.length <= 0) {
    console.log(chalk.bgHex(FailColor)(`未选择要发布的App`));
    return;
  }

  console.log("安装app项目依赖");
  await runCommand("pnpm i", {
    cwd: config.dirs.appsContainerDir,
  });

  const runTask = async ({
    logFileName,
    command,
    title,
    color,
    cwd,
  }: {
    logFileName: string;
    command: string;
    title: string;
    color: string;
    cwd: string;
  }) => {
    const logContents = ["", `## ${title}`, "", `### 命令: ${command}`, "", `### 日期: ${new Date().toLocaleString()}`, ""];
    let commandLog = "";
    const log = createLog({ title, titleBgColor: color });
    const code = await runCommand(command, {
      cwd,
      handleStdout: (data) => {
        log(data.toString());
        commandLog += data;
      },
    });
    const success = code == 0;
    const resultMessage = `${chalk.hex(color)(title)} ${
      success ? chalk.bgHex(SuccessColor)("✅成功") : chalk.bgHex(FailColor)("❌失败")
    }`;
    log(resultMessage);

    logContents.push(`### 结果: ${success ? "✅成功" : "❌失败"}`, "");
    logContents.push(`\`\`\`log\n${commandLog}\n\`\`\``);
    fs.writeFileSync(path.join(logDir, `${logFileName}-release-log.md`), logContents.join("\n"), {
      flag: "a",
    });
    return {
      resultMessage,
      success,
    };
  };

  const releaseAppPackageNames = [...new Set(releaseApps.map((item) => item.packageName))];

  console.log(
    "\n",
    chalk.bgHex(SuccessColor)(`已选择[${releaseAppPackageNames.length}个App] [${releaseApps.length}个发布版本]`),
    "\n"
  );

  const releaseResults: ({ resultMessage: string; success: boolean } & ReleaseApp)[] = [];
  for (const groupsAppPackageName of chunkArray(releaseAppPackageNames, config.appSyncHandleNumber)) {
    await Promise.all(
      groupsAppPackageName.map(async (appPackageName) => {
        const appConfig = appsConfig.find((app) => app.packageName === appPackageName);
        if (!appConfig) {
          console.error(`未找到项目: ${appPackageName}`);
          return;
        }
        for (const { env, appVersionType, updateVersionNumType } of releaseApps.filter(
          (item) => item.packageName === appPackageName
        )) {
          releaseResults.push({
            packageName: appPackageName,
            env,
            appVersionType,
            updateVersionNumType,
            ...(await runTask({
              logFileName: `${appConfig.type}-${appConfig.name}`,
              command: [
                `node ${path.join(__dirname, "app-start.js")}`,
                `-p ${appPackageName}`,
                `-m ${AppStartMode.BUILD}`,
                `-e ${env}`,
                `-u ${ConfirmType.YES}`,
                `-v ${appVersionType}`,
                `-t ${updateVersionNumType}`,
                `-c ${ConfirmType.NO}`,
              ].join(" "),
              title: `[${appConfig.index}]:${appConfig.type}/${appConfig.name}#${env}-${appVersionType}-${updateVersionNumType}`,
              color: Colors[appConfig.index] || "#f9ed69",
              cwd: config.dirs.rootDir,
            })),
          });
        }
      })
    );
  }

  cleanupTempHashFolders(config.dirs.rootDir);

  console.log("\n", chalk.green(`发布完成，查看日志: ${logDir}`), "\n");

  const successResults = releaseResults.filter((item) => item.success);
  const failResults = releaseResults.filter((item) => !item.success);

  if (successResults.length > 0) {
    console.log(chalk.bgHex(SuccessColor)(`[${successResults.length}个App 发布成功]`));
    successResults.forEach((item) => {
      console.log(item.resultMessage);
    });
  }

  if (failResults.length > 0) {
    console.log(chalk.bgHex(FailColor)(`[${failResults.length}个App 发布失败]`));
    failResults.forEach((item) => {
      console.log(item.resultMessage);
    });

    console.log(
      "\n",
      chalk.yellow("根目录下运行命令重新发布本次发布失败的项目: "),
      "\n",
      chalk.green(
        `pnpm run release -s "${failResults
          .map(({ packageName, env, appVersionType, updateVersionNumType }) => {
            const releaseApp: ReleaseApp = {
              packageName,
              env,
              appVersionType,
              updateVersionNumType,
            };
            return getQueryString(releaseApp as unknown as Record<string, string>);
          })
          .join(",")}"`
      ),
      "\n"
    );
  }
}
