
"use strict";

function execute(executeQueryHandler, executeFileQueryHandler){
    return executeFileQueryHandler(__dirname + '/roles.sql');
}

function init(executeQueryHandler, executeFileQueryHandler){
    return executeQueryHandler('CREATE SCHEMA IF NOT EXISTS "security"');
}


module.exports = {
    exec: execute,
    init: init
};
