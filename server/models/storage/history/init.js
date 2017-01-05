
"use strict";

function init(executeQueryHandler, executeFileQueryHandler){
    return executeQueryHandler('CREATE SCHEMA IF NOT EXISTS "history"');
}

module.exports = {
    init: init
};
