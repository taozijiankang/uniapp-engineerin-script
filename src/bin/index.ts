import { program } from "commander";
import { getConfig } from "../config/index.js";

async function start() {
  const config = await getConfig();
  const commands = config.commands;
  for (const name in commands) {
    const commandConfig = commands[name]!;
    const command = program.command(name).description(commandConfig.description);
    const { options: commandOptions, onAction: onCommandAction } = await commandConfig.setUp();
    for (const commandOption of commandOptions) {
      await commandOption.register(command);
    }
    command.action(async (options: any) => {
      for (const commandOption of commandOptions) {
        commandOption.setValue(options[commandOption.name]);
      }
      await onCommandAction();
    });
  }

  program.parse(process.argv);
}

start();
