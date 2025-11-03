import chalk from "chalk";

export function createLog({ title, titleBgColor }: { title: string; titleBgColor: string }) {
  return (message: string) => {
    message.split("\n").forEach((line) => {
      console.log(chalk.hex(titleBgColor)(`${title}:`), line);
    });
  };
}
