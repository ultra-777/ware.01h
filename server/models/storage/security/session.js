
"use strict";


function model(sequelize, DataTypes) {
    var definition =
        sequelize.define(
            "session",
            {
                id: { type: DataTypes.STRING(255), primaryKey: true, allowNull: false },
                data: { type: DataTypes.JSON },
                addressInitial: { type: DataTypes.STRING(256) },
                hostInitial:  { type: DataTypes.STRING(256), allowNull: true },
                addressLast: { type: DataTypes.STRING(256), allowNull: true },
                created: { type: DataTypes.DATE },
                updated: { type: DataTypes.DATE, allowNull: true }
            },
            {
                // don't add the timestamp attributes (updatedAt, createdAt)
                timestamps: false,

                schema: "security",

                tableName: 'Session',

                classMethods: {
                    get: function(sid, callback){
                        var schemaSession = sequelize.model('security.session');
                        var schemaAgent = sequelize.model('history.agent');
                        schemaSession.find({
                                where: {id: sid},
                                include: [{ model: schemaAgent, as: 'agent' }]
                            })
                            .then(function (session) {
                                callback(null, session);
                            })
                            .catch(function (err) {
                                callback && callback(err, null);
                            });
                    },
                    flush: function(sessionInstance, agentInstance, callback){
                        sequelize
                            .transaction({
                                autocommit: 'off',
                                isolationLevel: 'REPEATABLE READ'}
                            )
                            .then(function (t) {

                                if (agentInstance) {
                                    agentInstance
                                        .save({transaction: t})
                                        .then(function () {
                                            sessionInstance.agentId = agentInstance.id;
                                            sessionInstance
                                                .save({transaction: t})
                                                .then(function () {
                                                    t.commit();
                                                    callback && callback(null);
                                                })
                                                .catch(function (err) {
                                                    t.rollback();
                                                    callback && callback(err);
                                                });
                                        })
                                        .catch(function (err) {
                                            t.rollback();
                                            callback && callback(err);
                                        });
                                }
                                else {
                                    sessionInstance
                                        .save({transaction: t})
                                        .then(function () {
                                            t.commit();
                                            callback && callback(null);
                                        })
                                        .catch(function (err) {
                                            t.rollback();
                                            callback && callback(err);
                                        });
                                }
                            })
                            .catch(function(err){
                                t.rollback();
                                callback && callback(null, err);
                            });
                    }
                }
            }
        );
    return definition;
};

function configure(getObjectHandler){
    var agent = getObjectHandler('agent', 'history');
    var session = getObjectHandler('session', 'security');

    agent.hasOne(session, {as: 'agent', foreignKey : 'agentId'});

    session.belongsTo(agent);
}

module.exports = {
    model: model,
    config: configure
};
