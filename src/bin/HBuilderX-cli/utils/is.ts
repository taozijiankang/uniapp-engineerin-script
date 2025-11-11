import { runCommand } from "../../../utils/runCommand.js";

export async function HBuilderXIsOpen(cliPath: string) {
  /**
   * 这里用 --help 命令来判断 HBuilderX 是否启动
   * 因为 --help 命令需要启动 HBuilderX 才有结果
   */
  let helpData: Buffer = Buffer.from([]);
  await runCommand(`${cliPath} --help`, {
    handleStdout: (data) => {
      helpData = Buffer.concat([helpData, data]);
    },
  });

  return helpData.toString().length > 10;
}
