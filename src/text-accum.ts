export type AccumOptions = {
  pad?: boolean;
  ifAddedSince?: number;
};

export class TextAccum {
  text: string;

  constructor() {
    this.text = "";
  }

  mark(): number {
    return this.text.length;
  }

  add(part: string | undefined | null, options?: AccumOptions | boolean) {
    options ??= {};
    if (typeof options == "boolean") {
      options = { pad: options };
    }
    options.pad ??= true;

    if (!part) return;

    if (options.ifAddedSince != undefined && this.text.length == options.ifAddedSince) {
      return;
    }

    if (options.pad && this.text.length) {
      this.text += " ";
    }
    this.text += part;
  }
}
