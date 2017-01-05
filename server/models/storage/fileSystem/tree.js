"use strict";

function model(sequelize, DataTypes) {
    var definition =
        sequelize.define(
            "tree",
            {
                id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true, allowNull: false },
                repositoryId: { type: DataTypes.BIGINT},
                ownerId: { type: DataTypes.BIGINT},
                created: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
            },
            {
                // don't add the timestamp attributes (updatedAt, createdAt)
                timestamps: false,

                schema: "fileSystem",

                // define the table's name
                tableName: 'Tree'
            }
        );
    return definition;
};

function configure(getObjectHandler){
    var account = getObjectHandler('account', 'security');
    var tree = getObjectHandler('tree', 'fileSystem');
    var repository = getObjectHandler('repository', 'fileSystem');
    repository.hasOne(tree, {as: 'repository', foreignKey : 'repositoryId'});
    account.hasOne(tree, {as: 'owner', foreignKey : 'ownerId'});
    tree.belongsTo(repository);
    tree.belongsTo(account, {as: 'owner'});
}


module.exports = {
    model: model,
    config: configure
};

