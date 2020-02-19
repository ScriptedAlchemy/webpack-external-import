import Dependency from 'webpack/lib/Dependency';

export default class ContainerEntryDependency extends Dependency {
	constructor(dependencies, name) {
		super();
		this.exposedDependencies = dependencies;
		this.optional = true;
		this.loc = { name };
	}
}
