
var url = require('url'),
    dns = require('dns'),
    config = require('../common/config'),
    db = require('../models/storage/db'),
    uaParser = require('ua-parser-js'),
    toString = require('../common/stringify');



/**
 * Default options
 */

function optionsImpl(sourceOptions){
    var resultOptions = {
        defaultExpirationTime:  (sourceOptions && sourceOptions['defaultExpirationTime']) ? sourceOptions['defaultExpirationTime'] :  1000 * 60 * 5
        ,updateTimeout:  (sourceOptions && sourceOptions['updateTimeout']) ? sourceOptions['updateTimeout'] : 60 * 1000
    }
    return resultOptions;
};

var _options = null;

module.exports = function(connect) {
    var store = connect.Store || connect.session.Store;
    _options = new optionsImpl(connect.options);

    function updateSession(dbSession, session, ip, agent, callback) {

        if (ip !== null) {
            if ((dbSession.addressInitial === undefined) || (dbSession.addressInitial === null))
                dbSession.addressInitial = ip;
            dbSession.addressLast = ip;
        }

        var needFlush = checkIfUpdateRequired(dbSession, session);

        if (needFlush) {
            var schemaSession = db.getObject('session', 'security');
            schemaSession.flush(dbSession, agent, callback);
        }
        else
            callback && callback(null, dbSession);
    }

    function checkIfUpdateRequired(dbSession, session){

        var needFlush = false;
        var today = new Date();


        if (session && session.cookie){
            var expiration = new Date(today.getTime() + _options.defaultExpirationTime);
            session.cookie.expires = expiration;
        }

        if (!dbSession.created){
            needFlush = true;
            dbSession.created = today;
        }

        if (dbSession.updated){
            var diff = Math.abs(today - dbSession.updated);
            if (_options.updateTimeout < diff)
                needFlush = true;
        }

        var newData = JSON.parse(toString(session, 2));

        if (!needFlush){
            if (dbSession.data) {
                var newPassport = newData['passport'];
                var currentPassport = dbSession.data['passport'];
                if (newPassport && currentPassport){
                    if (newPassport['user'] != currentPassport['user'])
                        needFlush = true;
                }
                else if (!(!newPassport && !currentPassport))
                    needFlush = true;
            }
            else
                needFlush = true;
        }

        dbSession.data = newData;

        if (needFlush)
            dbSession.updated = today;

        return needFlush;
    }

    function loadSession(session, sid, destroy, callback){
        if (session) {
            if (!session.data.cookie.expires || Date.now() < new Date(session.data.cookie.expires)) {
                //console.log('-- load.session: ' + session.id + ' # ' + JSON.stringify(session.data))
                try {
                    callback(null, session.data);
                }
                catch(err){
                    var q = 0;
                }
            } else {
                destroy(sid, callback);
            }
        } else {
            callback && callback();
        }
    }

    /**
     * Initialize Impl with the given `options`.
     * Calls `callback` when db connection is ready (mainly for testing purposes).
     *
     * @param {Object} options
     * @param {Function} callback
     * @api public
     */

    function Impl() {

    };

    Impl.prototype.__proto__ = store.prototype;

    /**
     * Attempt to fetch session by the given `sid`.
     *
     * @param {String} sid
     * @param {Function} callback
     * @api public
     */

    Impl.prototype.get = function(sid, callback) {
        var schemaSession = db.getObject('session', 'security');
        schemaSession.get(sid, function(err, data){
           if (data){
               loadSession(data, sid, this.destroy, callback);
           }else {
               callback && callback(err, null);
           }
        });
    };

    /**
     * Commit the given `sess` object associated with the given `sid`.
     *
     * @param {String} sid
     * @param {Session} session
     * @param {Function} callback
     * @api public
     */

    Impl.prototype.set = function(sid, session, callback) {

        var schemaSession = db.getObject('session', 'security');

        var ip = null;
        if (
            (session !== undefined)
            && (session !== null)
            && (session.req !== null)
        )
        ip =
            (session.req.headers['x-forwarded-for'] || '').split(',')[0]
            || session.req.connection.remoteAddress;

        schemaSession.find({
            where: {id: sid}
        })
        .then(function (targetSession) {
            if (!targetSession) {
                targetSession = schemaSession.build();
                targetSession.id = sid;

                var schemaAgent = db.getObject('agent', 'history');
                var targetAgent = schemaAgent.build();

                var userAgentData =
                    (session.req.headers ?
                        session.req.headers['user-agent']
                        : null);

                if (userAgentData) {
                    var userAgentInfo = uaParser(userAgentData);
                    if (userAgentInfo){
                        if (userAgentInfo.browser){
                            targetAgent.browserName = userAgentInfo.browser.name;
                            targetAgent.browserVersion = userAgentInfo.browser.version;
                        }
                        if (userAgentInfo.engine){
                            targetAgent.engineName = userAgentInfo.engine.name;
                            targetAgent.engineVersion = userAgentInfo.engine.version;
                        }
                        if (userAgentInfo.os){
                            targetAgent.osName = userAgentInfo.os.name;
                            targetAgent.osVersion = userAgentInfo.os.version;
                        }
                        if (userAgentInfo.device){
                            targetAgent.deviceModel = userAgentInfo.device.model;
                            targetAgent.deviceType = userAgentInfo.device.type;
                            targetAgent.deviceVendor = userAgentInfo.device.vendor;
                        }
                        if (userAgentInfo.cpu){
                            targetAgent.cpuArchitecture = userAgentInfo.cpu.architecture;
                        }

                        if (ip) {
                            dns.reverse(ip, function (err, hostNames) {
                                var hostName = null;
                                if (hostNames && hostNames.length && hostNames.length > 0)
                                    hostName = hostNames[0];
                                if (hostName)
                                    targetSession.hostInitial = hostName;
                                updateSession(targetSession, session, ip, targetAgent, callback);
                            });
                        }
                        else {
                            updateSession(targetSession, session, ip, targetAgent, callback);
                        }
                    }
                }

            }
            else
                updateSession(targetSession, session, ip, null, callback);
        })
        .catch(function (err) {
            callback && callback(err);
        });

};

    /**
     * Destroy the session associated with the given `sid`.
     *
     * @param {String} sid
     * @param {Function} callback
     * @api public
     */

    Impl.prototype.destroy = function(sid, callback) {
        var schemaSession = db.getObject('session', 'security');
        schemaSession.find(
            {
                where: {id: sid}
            })
            .then(function(session){
                session.destroy()
                    .then(function(affectedRows){
                        callback && callback();
                    })
                    .catch(function(err){
                        callback && callback(err);
                    })
            })
            .catch(function(err){
                callback && callback(err);
            });
        // console.log('-- store destroy: ' + sid);
    };

    /**
     * Fetch number of sessions.
     *
     * @param {Function} callback
     * @api public
     */

    Impl.prototype.length = function(callback) {
        var schemaSession = db.getObject('session', 'security');

        schemaSession
            .count()
            .then(function(count) {
                callback && callback(null, count);
                // console.log('-- store length: ' + count);
            })
            .catch(function(err){
                callback && callback(err);
                // console.log('-- store length: ' + err);
            });
    };

    /**
     * Clear all sessions.
     *
     * @param {Function} callback
     * @api public
     */

    Impl.prototype.clear = function(callback) {
        var schemaSession = db.getObject('session', 'security');
        schemaSession.destroy(
            {},
            {truncate: true}
        )
            .then(function(affectedRows){
                callback && callback();
            })
            .catch(function(err){
                callback && callback(err);
            })
        // console.log('-- store clear: ');
    };

    return Impl;
};

