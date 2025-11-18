import { SelectCommandOption } from "./SelectCommandOption.js";
import { AppStartModeDicts } from "../constants/dicts.js";
import { AppStartMode } from "../constants/enum.js";

export class AppStartModeCO extends SelectCommandOption {
  constructor() {
    super({
      name: "appStartMode",
      description: "启动模式",
      options: AppStartModeDicts.map((item) => ({
        name: item.label,
        value: item.value,
      })),
      selectType: "single",
    });
  }

  async inquirer(deValue?: AppStartMode) {
    await super.inquirer(deValue);
  }
}
