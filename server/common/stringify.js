'use strict';

function flatStringify(x, depth) {

    var dump = '';
    var isArray = Array.isArray(x);

    function dumpElement(currentDump, currentElementKey, currentElementValue, currentDepth){

        var currentType = typeof currentElementValue;
        if (currentElementValue instanceof Date)
            currentType = 'date';
        var currentPresentation = undefined;

        if (currentElementValue === null)
            currentPresentation = 'null';
        else {
            switch (currentType) {
                case 'object':
                    if (!currentDepth || currentDepth > 1)
                        currentPresentation =
                            flatStringify(
                                currentElementValue,
                                currentDepth ?
                                    (currentDepth - 1)
                                    : currentDepth);
                    break;
                case 'boolean':
                case 'number':
                    currentPresentation = JSON.stringify(currentElementValue);
                    break;
                case 'string':
                    currentPresentation = JSON.stringify(currentElementValue);
                    break;
                case 'date':
                    currentPresentation = '\"' + currentElementValue.toJSON() + '\"';
                    break;
                default:
                    break;
            }
        }

        if (currentPresentation !== undefined){
            if (!currentDump)
                currentDump = '';

            if (currentDump.length > 0)
                currentDump = currentDump + ',';

            if (!isArray)
                currentDump = currentDump + '\"' + currentElementKey + '\"' + ': ';
            currentDump = currentDump + currentPresentation;
        }

        return currentDump;
    };

    var index = 0;
    var idElement = x['id'];
    if (idElement)
        dump = dumpElement(dump, 'id', idElement, depth);
    for(var i in x) {
        dump = dumpElement(dump, i, x[i], depth);
    }

    if (dump === '')
        return null;

    if (isArray)
        return '[' + dump + ']';
    return '{' + dump + '}';
}

module.exports = flatStringify;

