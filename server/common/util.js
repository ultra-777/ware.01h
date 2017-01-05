var glob = require('glob');

var sortFunction = function(a, b) {
	var value = 0;
	if (a && b) {
		var aValue = a.endsWith('.module.js') ? 1 : 0;
		var bValue = b.endsWith('.module.js') ? 1 : 0;
		if (aValue != bValue)
			value = (aValue > bValue) ? -1 : 1;
		else
			value = a.localeCompare(b);
	}
	return value;
};

/**
 * Get leafs by glob patterns
 */
module.exports.getGlobbedFiles = function(globPatterns, removeRoot) {
	var self = this;
	var urlRegex = new RegExp('^(?:[a-z]+:)?//', 'i');
	var output = [];

	// If glob pattern is array so we use each pattern in a recursive way, otherwise we use glob
	if (Array.isArray(globPatterns)) {
		globPatterns.forEach(function(globPattern) {
			var localResult = self.getGlobbedFiles(globPattern, removeRoot);
			localResult.sort(sortFunction);
			output = output.concat(localResult);
		});
	} else if (typeof globPatterns === 'string') {
		if (urlRegex.test(globPatterns)) {
			output.push(globPatterns);
		} else {
			var files = glob(globPatterns, {
				sync: true
			});

			if (removeRoot) {
				var localResult = files.map(function(file) {
					return file.replace(removeRoot, '');
				});
				localResult.sort(sortFunction);
				files = localResult;
			}

			output = output.concat(files);
		}
	}
	return output;
};
