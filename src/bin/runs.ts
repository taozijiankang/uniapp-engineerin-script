import { runCommand } from "../utils/runCommand.js";
import { getProjectConfigExtend } from "../config/index.js";
import { Command } from "../command/Command.js";
import { SelectCommandOption } from "../command/SelectCommandOption.js";
import { getRunCode } from "../utils/global.js";

const COMMAND_NAME = "runs";

export type RunsOptions = {
  runsCommands?: string;
};

export class RunsCommand extends Command {
  constructor() {
    super({
      name: COMMAND_NAME,
      description: "执行命令",
    });
  }
  async setUp() {
    const config = await getProjectConfigExtend();

    const runsCommandsOption = new SelectCommandOption({
      name: "runsCommands",
      description: "选择要执行的命令",
      options:
        config.runsCommands?.map((item) => ({
          name: `${item.command}: ${item.description}`,
          value: item.command,
        })) || [],
      selectType: "single",
    });

    return {
      options: [runsCommandsOption],
      onAction: async () => {
        let runsCommands = runsCommandsOption.value;
        while (!runsCommandsOption.value) {
          await runsCommandsOption.inquirer();
          runsCommands = runsCommandsOption.value;
        }
        await runCommand(runsCommands!, { cwd: process.cwd(), stdio: "inherit" });
      },
    };
  }

  static getRunCode(options: RunsOptions) {
    return getRunCode(COMMAND_NAME, options);
  }
}
