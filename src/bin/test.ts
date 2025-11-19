import { Command } from "../command/Command.js";
import { CleanupTempHashFoldersCommand } from "./cleanup-temp-folders.js";
import { getRunCode } from "../utils/global.js";
import { CopyPluginCommand } from "./copy-plugin.js";
import { CreateAppPagesCommand } from "./create-app-pages.js";
import { CreateAppCommand } from "./create-app.js";
import { CreateCorePagesCommand } from "./create-core-pages.js";
import { ElderTransformCommand } from "./elder-transform.js";
import { GenerateAppItemPagesJsonCommand } from "./generate-app-item-pages-json.js";
import { GenerateAppItemManifestJsonCommand } from "./generate-app-item-manifest-json.js";
import { MiniprogramSubpackageOptimizationCommand } from "./miniprogram-subpackage-optimization.js";
import { OpenWxToolCommand } from "./open-wx-tool.js";
import { RunsCommand } from "./runs.js";
import { StartUniappAppCommand } from "./start-uniapp-app.js";
import { UploadMpCommand } from "./upload-mp.js";
import { UpdateVersionNumType } from "../constants/enum.js";
import { AppStartMode } from "../constants/enum.js";

const COMMAND_NAME = "test";

export type TestOptions = {};

export class TestCommand extends Command {
  constructor() {
    super({
      name: COMMAND_NAME,
      description: "测试命令",
    });
  }
  async setUp() {
    return {
      onAction: async () => {
        await test();
      },
    };
  }

  static getRunCode(options: TestOptions) {
    return getRunCode(COMMAND_NAME, options);
  }
}

async function test() {
  console.log("test");

  console.log("各命令的运行代码示例：");
  console.log(CleanupTempHashFoldersCommand.getRunCode({ targetDir: process.cwd() }));
  console.log(CopyPluginCommand.getRunCode({}));
  console.log(CreateAppPagesCommand.getRunCode({}));
  console.log(
    CreateAppCommand.getRunCode({
      packageNames: "test",
    })
  );
  console.log(CreateCorePagesCommand.getRunCode({}));
  console.log(ElderTransformCommand.getRunCode({}));
  console.log(GenerateAppItemPagesJsonCommand.getRunCode({}));
  console.log(GenerateAppItemManifestJsonCommand.getRunCode({}));
  console.log(MiniprogramSubpackageOptimizationCommand.getRunCode({}));
  console.log(OpenWxToolCommand.getRunCode({ packageName: "test", mode: AppStartMode.DEV }));
  console.log(RunsCommand.getRunCode({}));
  console.log(StartUniappAppCommand.getRunCode({ packageName: "test", mode: AppStartMode.DEV }));
  console.log(TestCommand.getRunCode({}));
  console.log(
    UploadMpCommand.getRunCode({
      packageName: "test",
      env: "development",
      ciRobot: 1,
      updateVersionNumType: UpdateVersionNumType.PATCH,
      appid: "test",
      privateKey: "test",
    })
  );
}
