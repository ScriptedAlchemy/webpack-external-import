export default class ContainerReferencePlugin {
  constructor(options) {
    this.options = {
      remoteType: options.remoteType ?? null, // TODO: Mark this as required?
      remote: options.remote ?? [],
      override: options.override ?? {}
    };

    // TODO: Apply some validation around what was passed in.
  }

  apply(compiler) {
    throw new Error("Plugin not implemented yet");

    // TODO: _body_ of the plugin to come from ./webpack/X
  }
}
