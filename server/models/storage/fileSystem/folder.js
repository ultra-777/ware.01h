"use strict";

var path = require('path');

function model(sequelize, DataTypes) {

    var definition =
        sequelize.define(
            "folder",
            {
                id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true, allowNull: false },
                repositoryId: { type: DataTypes.BIGINT, allowNull: false },
                parentPath: { type: DataTypes.STRING, allowNull: false },
                parentId: { type: DataTypes.BIGINT },
                created: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
            },
            {
                // don't add the timestamp attributes (updatedAt, createdAt)
                timestamps: false,

                schema: "fileSystem",

                // define the table's name
                tableName: 'Folder',

                instanceMethods: {

                    getLocation: function (includeRepository) {

                        var realFolderPath = '';
                        var parentPathParts = this.parentPath.split('.');
                        for (var p = 0; p < parentPathParts.length; p++){
                            realFolderPath += path.sep;
                            realFolderPath += parentPathParts[p];
                        }
                        if (realFolderPath.length > 0)
                            realFolderPath += path.sep;
                        realFolderPath += this.id;

                        if (includeRepository && this.repository)
                            return path.join(this.repository.location, realFolderPath);
                        else
                            return realFolderPath;
                    }
                },

                getterMethods   : {
                    path : function() {
                        return this.parentPath + '.' + this.id;
                    }
                }
            }
        );
    return definition;
};

function configure(getObjectHandler){
    var folder = getObjectHandler('folder', 'fileSystem');
    var repository = getObjectHandler('repository', 'fileSystem');
    folder.hasOne(folder, {as: 'parent', foreignKey : 'parentId'});
    repository.hasOne(folder, {as: 'repository', foreignKey : 'repositoryId'});
    folder.belongsTo(repository);
}

function exec(executeQueryHandler){
    executeQueryHandler('CREATE INDEX IF NOT EXISTS "IX_Parent" ON "fileSystem"."Folder" USING btree ("parentId")')
    .error(function(err){
        console.error('Exception: %s (%s)', err.message, err.sql);
    });
}


module.exports = {
    model: model,
    config: configure,
    exec: exec
};

