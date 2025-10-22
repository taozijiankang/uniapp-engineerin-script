import chalk from "chalk";

export function createLog() {
  let onTitle = "";

  const log = (data: string, title = "", titleBgColor = "#ffffff") => {
    if (title != onTitle) {
      console.log(chalk.bgHex(titleBgColor)(" "), chalk.hex(titleBgColor)(`[${title}]:`), "\n");
      onTitle = title;
    }
    console.log(data);
  };

  return log;
}
