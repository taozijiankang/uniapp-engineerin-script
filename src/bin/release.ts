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

import { FailColor, SuccessColor } from "../constants/color.js";
import { AppStartMode, ConfirmType, UpdateVersionNumType, UpdateVersionNumTypeDicts } from "../constants/index.js";
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
  apps?: string;
  /** 默认全选 */
  all?: boolean;
  /** 环境 */
  envs?: string;
  /** 更新版本号类型 */
  updateVersionNumType?: string;
}

interface ReleaseApp {
  packageName: string;
  env: string;
  updateVersionNumType: string;
}

program
  .version(packageJson.version)
  .description("发布项目")
  .option("-s, --apps <apps>", "要发布的项目，多个项目用逗号分隔，query 参数格式：packageName=xxx&env=xxx&type=xxx&version=xxx")
  .option("-a, --all", "默认全选")
  .option("-e, --envs <envs>", "环境")
  .option("-u, --updateVersionNumType <updateVersionNumType>", "更新版本号类型")
  .action(() => {
    release(program.opts());
  })
  .parse(process.argv);

async function release(args: ReleaseOptions) {
  const config = await getConfig();

  let {
    apps: argsApps = "",
    all: argsAll = false,
    envs: argsEnvStr = "",
    updateVersionNumType: argsUpdateVersionNumType = "",
  } = args;

  let argsEnvs: string[] = argsEnvStr.split(",").filter(Boolean);

  const releaseKey = `${dayjs().format("YYYY-MM-DD_HH-mm-ss")}`;
  const logDir = path.join(config.dirs.logsDir, releaseKey);
  try {
    fs.mkdirSync(logDir, { recursive: true });
  } catch {}

  let releaseApps: ReleaseApp[] = argsApps
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

    if (argsEnvs.length <= 0) {
      const { envs }: { envs: string[] } = await inquirer.prompt([
        {
          type: "checkbox",
          name: "envs",
          message: "请选择环境：",
          choices: [
            ...new Set(
              appsConfig
                .filter((item) => appPackageNames.some((packageName) => packageName === item.packageName))
                .map((item) => item.envs || [])
                .flat()
                .filter((item) => {
                  // 如果配置了微信小程序，则只选择有 ciRobot 的环境
                  if (!!config.wx) {
                    return !!item.ciRobot;
                  }
                  return true;
                })
                .map((item) => item.name)
            ),
          ].map((item) => ({
            value: item,
            name: item,
          })),
        },
      ]);

      argsEnvs = envs;
    }

    if (argsEnvs.length <= 0) {
      console.log(chalk.bgHex(FailColor)(`未选择要发布的环境`));
      return;
    }

    if (!argsUpdateVersionNumType) {
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

      argsUpdateVersionNumType = updateVersionNumType;
    } else {
      if (!UpdateVersionNumTypeDicts.find((item) => item.value === argsUpdateVersionNumType)) {
        throw new Error(`无效的更新版本号类型: ${argsUpdateVersionNumType}`);
      }
    }

    for (const appPackageName of appPackageNames) {
      const appConfig = appsConfig.find((app) => app.packageName === appPackageName);
      if (!appConfig) {
        console.error(`未找到项目: ${appPackageName}`);
        continue;
      }
      for (const env of argsEnvs) {
        if (!appConfig.envs?.some((item) => item.name === env)) {
          continue;
        }
        releaseApps.push({
          packageName: appPackageName,
          env,
          updateVersionNumType: argsUpdateVersionNumType,
        });
      }
    }
  }

  if (releaseApps.length <= 0) {
    console.log(chalk.bgHex(FailColor)(`未选择要发布的App`));
    return;
  }

  const releaseAppPackageNames = [...new Set(releaseApps.map((item) => item.packageName))];

  const confirmReleaseAppsOptions = releaseApps
    .map((item, index) => {
      const appConfig = appsConfig.find((app) => app.packageName === item.packageName);
      if (!appConfig) {
        return null;
      }
      return {
        name: `${appConfig.description || appConfig.name} [${appConfig.key}]: ${
          appConfig.envs?.find((env) => env.name === item.env)?.description || item.env
        }-${UpdateVersionNumTypeDicts.find((type) => type.value === item.updateVersionNumType)?.label}`,
        value: index,
        item,
      };
    })
    .filter(Boolean);

  const { confirmReleaseApps }: { confirmReleaseApps: number[] } = await inquirer.prompt([
    {
      type: "checkbox-plus",
      name: "confirmReleaseApps",
      highlight: true,
      searchable: true,
      pageSize: 20,
      default: confirmReleaseAppsOptions.map((item) => item?.value),
      message: `确认发布内容(${confirmReleaseAppsOptions.length})：`,
      source: async (_: any, input: string) => {
        input = (input || "").trim();
        return fuzzy
          .filter(input, confirmReleaseAppsOptions, {
            extract: (item) => item?.name || "",
          })
          .map((item) => item.original);
      },
    },
  ]);

  if (confirmReleaseApps.length <= 0) {
    console.log(chalk.bgHex(FailColor)(`未选择要发布的App`));
    return;
  }

  releaseApps = confirmReleaseAppsOptions
    .filter((item) => confirmReleaseApps.some((index) => index === item?.value))
    .map((item) => item?.item as ReleaseApp)
    .filter(Boolean);

  console.log("创建app项目");
  await createApps(
    appsConfig.filter((item) => releaseAppPackageNames.some((packageName) => packageName === item.packageName)),
    {
      appPackageDir: config.dirs.appPackageDir,
      appSyncHandleNumber: config.appSyncHandleNumber,
      appEnvKeyDicts: config.appEnvKeyDicts,
      distributionApp: config.distributionApp,
      wxConfig: config.wx,
      opAppConfig: config.app,
    }
  );

  console.log("安装app项目依赖");
  await runCommand("pnpm i", {
    cwd: config.dirs.appsContainerDir,
  });

  const releaseResults: ({ resultMessage: string; success: boolean } & ReleaseApp)[] = [];
  for (const groupsAppPackageName of chunkArray(releaseAppPackageNames, config.appSyncHandleNumber)) {
    await Promise.all(
      groupsAppPackageName.map(async (appPackageName) => {
        const appConfig = appsConfig.find((app) => app.packageName === appPackageName);
        if (!appConfig) {
          console.error(`未找到项目: ${appPackageName}`);
          return;
        }
        for (const { env, updateVersionNumType } of releaseApps.filter((item) => item.packageName === appPackageName)) {
          releaseResults.push({
            packageName: appPackageName,
            env,
            updateVersionNumType,
            ...(await runTask({
              logFilePath: path.join(logDir, `${appConfig.key}-release-log.md`),
              command: [
                `node ${path.join(__dirname, "app-start.js")}`,
                `-p ${appPackageName}`,
                `-m ${AppStartMode.BUILD}`,
                `-e ${env}`,
                `-u ${ConfirmType.YES}`,
                `-t ${updateVersionNumType}`,
                `-c ${ConfirmType.NO}`,
              ].join(" "),
              title: `[${appConfig.index}]:${appConfig.key}#${env}-${updateVersionNumType}`,
              color: appConfig.signColor,
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
    console.log(chalk.bgHex(SuccessColor)(`[${successResults.length}个任务执行成功]`));
    successResults.forEach((item) => {
      console.log(item.resultMessage);
    });
  }

  if (failResults.length > 0) {
    console.log(chalk.bgHex(FailColor)(`[${failResults.length}个任务执行失败]`));
    failResults.forEach((item) => {
      console.log(item.resultMessage);
    });

    console.log(
      "\n",
      chalk.yellow("根目录下运行命令重新执行本次执行失败的任务: "),
      "\n",
      chalk.green(
        `npx taozi-ues-release -s "${failResults
          .map(({ packageName, env, updateVersionNumType }) => {
            const releaseApp: ReleaseApp = {
              packageName,
              env,
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

async function runTask({
  logFilePath,
  command,
  title,
  color,
  cwd,
}: {
  logFilePath: string;
  command: string;
  title: string;
  color: string;
  cwd: string;
}) {
  const logContents = ["", `## ${title}`, "", `### 命令: ${command}`, "", `### 日期: ${new Date().toLocaleString()}`, ""];
  let commandLog = Buffer.from([]);
  const log = createLog({ title, titleBgColor: color });
  const code = await runCommand(command, {
    cwd,
    handleStdout: (data) => {
      log(data.toString());
      commandLog = Buffer.concat([commandLog, data]);
    },
  });
  const success = code == 0;
  const resultMessage = `${chalk.hex(color)(title)} ${
    success ? chalk.bgHex(SuccessColor)("✅成功") : chalk.bgHex(FailColor)("❌失败")
  }`;
  log(resultMessage);

  logContents.push(`### 结果: ${success ? "✅成功" : "❌失败"}`, "");
  logContents.push(`\`\`\`log\n${commandLog.toString().trim()}\n\`\`\``);
  fs.writeFileSync(logFilePath, logContents.join("\n"), {
    flag: "a",
  });
  return {
    resultMessage,
    success,
  };
}
