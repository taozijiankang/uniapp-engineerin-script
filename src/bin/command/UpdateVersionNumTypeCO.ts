import { UpdateVersionNumTypeDicts } from "../../constants/dicts.js";
import { SelectCommandOption } from "./SelectCommandOption.js";
import { UpdateVersionNumType } from "../../constants/enum.js";

export class UpdateVersionNumTypeCO extends SelectCommandOption {
  constructor() {
    super({
      name: "updateVersionNumType",
      description: "更新版本号类型",
      options: UpdateVersionNumTypeDicts.map((item) => ({
        name: item.label,
        value: item.value,
      })),
      selectType: "single",
    });
  }

  async inquirer(deValue?: UpdateVersionNumType) {
    await super.inquirer(deValue);
  }
}
