import { program } from "commander";
import { getConfig } from "../config/index.js";
import { packageJson } from "../packageJson.js";
import { CleanupTempHashFoldersCommand } from "./cleanup-temp-folders.js";
import { CopyPluginCommand } from "./copy-plugin.js";
import { CreateAppPagesCommand } from "./create-app-pages.js";
import { CreateCorePagesCommand } from "./create-core-pages.js";
import { CreateAppCommand } from "./create-app.js";
import { ElderTransformCommand } from "./elder-transform.js";
import { GenerateAppItemPagesJsonCommand } from "./generate-app-item-pages-json.js";
import { GenerateAppItemManifestJsonCommand } from "./generate-app-item-manifest-json.js";
import { MiniprogramSubpackageOptimizationCommand } from "./miniprogram-subpackage-optimization.js";
import { OpenWxToolCommand } from "./open-wx-tool.js";
import { RunsCommand } from "./runs.js";
import { StartUniappAppCommand } from "./start-uniapp-app.js";
import { TestCommand } from "./test.js";
import { UploadMpCommand } from "./upload-mp.js";

start();

async function start() {
  program.version(packageJson.version).description("桃子科技 uniapp 工程化脚本CLI");

  /**
   * 注册内置命令
   */
  await new CleanupTempHashFoldersCommand().register(program);
  await new CopyPluginCommand().register(program);
  await new CreateAppPagesCommand().register(program);
  await new CreateAppCommand().register(program);
  await new CreateCorePagesCommand().register(program);
  await new ElderTransformCommand().register(program);
  await new GenerateAppItemPagesJsonCommand().register(program);
  await new GenerateAppItemManifestJsonCommand().register(program);
  await new MiniprogramSubpackageOptimizationCommand().register(program);
  await new OpenWxToolCommand().register(program);
  await new RunsCommand().register(program);
  await new StartUniappAppCommand().register(program);
  await new TestCommand().register(program);
  await new UploadMpCommand().register(program);

  /**
   * 注册自定义命令
   */
  const config = await getConfig();
  for (const command of config.customCommands || []) {
    await command.register(program);
  }

  program.parse(process.argv);
}
