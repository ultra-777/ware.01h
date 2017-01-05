function exactResult(succeeded, data, errorMessage) {
    return {
        succeeded: succeeded,
        data: data,
        message: errorMessage
    };
}

module.exports.success = function(data) {
    return exactResult(true, data, null);
};

module.exports.failure = function(errorMessage) {
    return exactResult(false, null, errorMessage);
};
