
"use strict";


var crypto = require('crypto');

function model(sequelize, DataTypes) {

    var definition =
        sequelize.define(
            "account",
            {
                name: { type: DataTypes.STRING, unique: true },
                firstName: { type: DataTypes.STRING },
                lastName: { type: DataTypes.STRING },
                email: { type: DataTypes.STRING },
                password: { type: DataTypes.STRING },
                salt: { type: DataTypes.STRING },
                provider: { type: DataTypes.STRING },
                updated: { type: DataTypes.DATE },
                created: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
            },
            {
                // don't add the timestamp attributes (updatedAt, createdAt)
                timestamps: false,

                schema: "security",

                // define the table's name
                tableName: 'Account',

                hooks: {
                    beforeUpdate: function (user, fn){
                        user.onBeforeUpdate(user, fn);
                    },
                    beforeCreate: function (user, fn){
                        user.onBeforeCreate(user, fn);
                    }
                },

                classMethods: {

                    create: function(
                        name,
                        password,
                        email,
                        firstName,
                        lastName,
                        provider,
                        roleName,
                        callback /*function(account, error)*/) {

                        var accountSchema = sequelize.model('security.account');
                        var roleSchema = sequelize.model('security.role');

                        sequelize
                            .transaction({
                                autocommit: 'off',
                                isolationLevel: 'REPEATABLE READ'
                            })
                            .then(function (t) {
                                var account = accountSchema.build();
                                account.name = name;
                                account.firstName = firstName;
                                account.lastName = lastName;
                                account.email = email;
                                account.password = password;
                                account.provider = provider;
                                account.displayName =
                                    account.firstName +
                                    ' ' +
                                    account.lastName;

                                account
                                    .save({transaction: t})
                                    .then(function () {

                                        roleSchema.find({
                                            where: ['name = ?', roleName],
                                            transaction: t
                                        })
                                            .then(function (targetRole) {
                                                if (targetRole) {
                                                    account
                                                        .setRoles([targetRole], {transaction: t})
                                                        .then(function () {
                                                            t
                                                                .commit()
                                                                .catch(function (err) {
                                                                    callback && callback(null, err);
                                                                })
                                                                .then(function () {

                                                                    // Remove sensitive data before login
                                                                    account.password = undefined;
                                                                    account.salt = undefined;
                                                                    callback && callback(account, null);
                                                                });

                                                        },function (err) {
                                                            t.rollback();
                                                            callback && callback(null, err);
                                                        });
                                                }
                                                else {
                                                    t.rollback();
                                                    callback && callback(null, err);
                                                }
                                            })
                                            .catch(function (err) {
                                                t.rollback();
                                                callback && callback(null, err);
                                            });
                                    })
                                    .catch(function (err) {
                                        t.rollback();
                                        callback && callback(null, err);
                                    })
                            })
                            .catch(function (err) {
                                t.rollback();
                                callback && callback(null, err);
                            });
                    }
                },

                instanceMethods: {

                    onBeforeCreate: function (user, fn) {
                        if (user.password && user.password.length > 6) {
                            user.salt = crypto.randomBytes(16).toString('base64');
                            user.password = user.hashPassword(user.password);
                        }

                        return;
                    },

                    onBeforeUpdate: function (user, fn) {
                        /*
                        if (user.password && user.password.length > 6) {
                            user.password = user.hashPassword(user.password);
                        }
                        */
                        return;
                    },

                    hashPassword: function (rawPassword) {
                        var result = rawPassword;
                        if (this.salt && rawPassword) {
                            result =
                                crypto.pbkdf2Sync(
                                    rawPassword,
                                    this.salt,
                                    10000,
                                    64).toString('base64');
                        }
                        // console.log(" -- " + rawPassword + " + " + this.salt.toString('base64') + " = " + result );
                        return result;
                    },

                    authenticate: function(password) {
                        return this.password === this.hashPassword(password);
                    }
                }
            }
        );
    return definition;
};

function configure(getObjectHandler){
    var account = getObjectHandler('account', 'security');
    var role = getObjectHandler('role', 'security');
    account.belongsToMany(role, { as: {singular: 'role', plural: 'roles'}, through: 'AccountRole' });
    role.belongsToMany(account, { as: {singular: 'account', plural: 'accounts'}, through: 'AccountRole' });
}


module.exports = {
    model: model,
    config: configure
};

