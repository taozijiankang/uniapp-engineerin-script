import { Command as CommanderCommand } from "commander";
import { BaseCommandOption } from "./BaseCommandOption.js";

export class Command {
  name: string;
  description: string;

  constructor(options: { name: string; description: string }) {
    this.name = options.name;
    this.description = options.description;
  }

  async register(program: CommanderCommand) {
    const command = program.command(this.name).description(this.description);
    const { options: commandOptions = [], onAction: onCommandAction } = (await this.setUp()) || {};
    for (const commandOption of commandOptions) {
      await commandOption.register(command);
    }
    command.action(async (options: any) => {
      for (const commandOption of commandOptions) {
        commandOption.setValue(options[commandOption.name]);
      }
      await onCommandAction?.();
    });
  }

  async setUp(): Promise<{ options?: BaseCommandOption[]; onAction?: () => Promise<void> } | undefined> {
    return;
  }
}
