#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { program } from "commander";
import semver from "semver";
import type { CIProject } from "miniprogram-ci";
import chalk from "chalk";

import { packageJson } from "../packageJson.js";
import { getGitInfo } from "../utils/getGitInfo.js";
import { AppConfigExtend } from "../types/config.js";
import { UpdateVersionNumType } from "../constants/enum.js";
import { UpdateVersionNumTypeDicts } from "../constants/dicts.js";
import { getApps } from "../appManage/getApps.js";
import { getConfig } from "../config/index.js";
import { getRootDir } from "../pathManage.js";

program.version(packageJson.version).description("上传小程序");

export interface UploadMpOptions {
  packageName?: string;
  env?: string;
  ciRobot?: string;
  updateVersionNumType?: string;
  appid?: string;
  privateKey?: string;
}

program
  .description("上传小程序")
  .option("-n, --packageName <packageName>", "项目包名")
  .option("-e, --env <env>", "环境")
  .option("-r, --ciRobot <ciRobot>", "ci 机器人编号")
  .option("-u, --updateVersionNumType <updateVersionNumType>", "更新版本号类型")
  .option("-a, --appid <appid>", "appid")
  .option("-k, --privateKey <privateKey>", "privateKey")
  .action(async (options: UploadMpOptions) => {
    const { packageName, env, ciRobot, updateVersionNumType, appid, privateKey } = options;

    if (!packageName) {
      console.error(chalk.red("请指定项目包名"));
      return;
    }
    const config = await getConfig();
    const appsConfig = getApps(config);
    const appConfig = appsConfig.find((item) => item.packageName === packageName);

    if (!appConfig) {
      console.error(chalk.red(`未找到项目: ${packageName}`));
      return;
    }
    if (!env) {
      console.error(chalk.red("请指定环境"));
      return;
    }
    if (!config.appEnvKeyDicts?.find((item) => item.value === env)) {
      console.error(chalk.red(`未找到环境: ${env}`));
      return;
    }
    if (!ciRobot) {
      console.error(chalk.red("请指定 ci 机器人编号"));
      return;
    }
    const ciRobotNumber = parseInt(ciRobot);
    if (ciRobotNumber <= 0 || ciRobotNumber > 30) {
      console.error(chalk.red("ci 机器人编号必须在 1-30 之间"));
      return;
    }
    if (!updateVersionNumType) {
      console.error(chalk.red("请指定更新版本号类型"));
      return;
    }
    if (!UpdateVersionNumTypeDicts.find((item) => item.value === updateVersionNumType)) {
      console.error(chalk.red(`无效的更新版本号类型: ${updateVersionNumType}`));
      return;
    }
    if (!appid) {
      console.error(chalk.red("请指定 appid"));
      return;
    }
    if (!privateKey) {
      console.error(chalk.red("请指定 privateKey"));
      return;
    }
    await uploadMp({
      appConfig,
      env,
      ciRobot: ciRobotNumber,
      updateVersionNumType: updateVersionNumType as UpdateVersionNumType,
      appid,
      privateKey,
    });
  });

program.parse(process.argv);

async function uploadMp(options: {
  appConfig: AppConfigExtend;
  env: string;
  ciRobot: number;
  updateVersionNumType: UpdateVersionNumType;
  appid: string;
  privateKey: string;
}) {
  const { appConfig, env, ciRobot, updateVersionNumType, appid, privateKey } = options;

  const weixinMPBuildPath = path.join(appConfig.path, "dist/build/mp-weixin");

  const { default: miniprogramCi } = await import("miniprogram-ci");

  const project = new miniprogramCi.Project({
    appid,
    type: "miniProgram",
    projectPath: weixinMPBuildPath,
    privateKey,
  });

  console.log(`获取小程序 ${appConfig.description || appConfig.name} 机器人 ${ciRobot} 最新版本...`);
  const latestVersion = await getAppLatestVersion(project, ciRobot)
    .then((version) => {
      console.log(`小程序 ${appConfig.description || appConfig.name} 机器人 ${ciRobot} 最新版本为: ${version}`);
      return version;
    })
    .catch((error) => {
      console.error(`获取小程序 ${appConfig.description || appConfig.name} 最新版本失败，机器人: ${ciRobot}，错误:`, error);
      const version = JSON.parse(fs.readFileSync(path.join(appConfig.path, "package.json"), "utf8")).version;
      console.log(`使用 package.json 中的版本号: ${version}`);
      return version;
    });

  const releaseType =
    updateVersionNumType === UpdateVersionNumType.MAJOR
      ? "major"
      : updateVersionNumType === UpdateVersionNumType.MINOR
      ? "minor"
      : updateVersionNumType === UpdateVersionNumType.PATCH
      ? "patch"
      : undefined;

  const newVersion = releaseType ? semver.inc(latestVersion, releaseType) : latestVersion;

  const desc = [
    {
      label: "应用名称",
      value: appConfig.description || appConfig.name,
    },
    {
      label: "环境",
      value: appConfig.envs?.find((item) => item.name === env)?.description || env,
    },
    {
      label: "提交信息",
      value: await getGitInfo({
        cwd: appConfig.path,
      }),
    },
  ]
    .map((item) => `[${item.label}: ${item.value}]`)
    .join(" ");

  const upload = async () => {
    const uploadResult = await miniprogramCi.upload({
      project,
      version: newVersion,
      desc,
      robot: ciRobot,
      onProgressUpdate: () => {
        //
      },
    });
    console.log(uploadResult);
    console.log(`${desc} 版本号: ${newVersion} 上传成功`);
  };
  // 重试3次
  let p = Promise.resolve(upload());
  for (let i = 0; i < 3; i++) {
    p = p.catch(() => upload());
  }
  await p;
}

async function getAppLatestVersion(project: CIProject, robotNumber: number) {
  const { default: miniprogramCi } = await import("miniprogram-ci");
  const { default: unzipper } = await import("unzipper");

  const appid = project.appid;

  const sourceMapSavePath = `${getRootDir()}/node_modules/.app-sm-cache/app-${appid}-robot-${robotNumber}-sm.zip`;

  if (!fs.statSync(path.dirname(sourceMapSavePath), { throwIfNoEntry: false })?.isDirectory()) {
    fs.mkdirSync(path.dirname(sourceMapSavePath), { recursive: true });
  }

  await miniprogramCi.getDevSourceMap({
    project,
    robot: robotNumber,
    sourceMapSavePath,
  });

  const directory = await unzipper.Open.file(sourceMapSavePath);
  const appServiceMapFile = directory.files.find((item) =>
    /^\/(__APP__|__FULL__)\/(app-service\.js\.map|appservice\.app\.js\.map)$/.test(item.path)
  );
  if (!appServiceMapFile) {
    throw new Error(
      `获取小程序${appid}最新版本失败，机器人: ${robotNumber}，错误: (__APP__|__FULL__)/(app-service.js.map|appservice.app.js.map) 文件不存在`
    );
  }
  const appServiceMap: {
    wx: {
      version: string | number;
      userVersion: string;
      userNotes: string;
    };
  } = JSON.parse((await appServiceMapFile.buffer()).toString());

  return appServiceMap.wx.userVersion;
}
