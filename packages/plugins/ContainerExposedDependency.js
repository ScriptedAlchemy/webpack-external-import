import ModuleDependency from 'webpack/lib/dependencies/ModuleDependency';

export default class ContainerExposedDependency extends ModuleDependency {
	constructor(name, request) {
		super(request);
		this._name = name;
	}

	get exposedName() {
		return this._name;
	}

	getResourceIdentifier() {
		return `exposed dependency ${this._name}`;
	}
}
