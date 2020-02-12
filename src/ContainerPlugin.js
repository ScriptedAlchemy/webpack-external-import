export default class ContainerPlugin {
  constructor(options) {
    const name = options.name ?? "defualt"; // TODO: Can we assume this, or mark it as required?

    this.options = {
      overridable: options.overridable ?? null,
      name,
      library: options.library ?? name,
      libraryTarget: options.libraryTarget ?? "var",
      expose: options.expose ?? {}
    };

    // TODO: Apply some validation around what was passed in.
  }

  apply(compiler) {
    throw new Error("Plugin not implemented yet");

    // TODO: _body_ of the plugin to come from ./webpack/X
  }
}
