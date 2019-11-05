if ((typeof process !== 'undefined') && (process.release.name === 'node')) {
} else if (!window.import) {
    window.import = require('dimport/legacy');
}
