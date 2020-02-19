import ModuleFactory from 'webpack/lib/ModuleFactory';
import ContainerEntryModule from './ContainerEntryModule';

export default class ContainerEntryModuleFactory extends ModuleFactory {
	create({ dependencies: [dependency] }, callback) {
		callback(null, {
			module: new ContainerEntryModule(dependency),
		});
	}
}
