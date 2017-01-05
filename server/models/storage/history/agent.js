
"use strict";

function model(sequelize, DataTypes) {
    var definition =
        sequelize.define(
            "agent",
            {
                id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true, allowNull: false },
                browserName: { type: DataTypes.STRING(256), allowNull: true },
                browserVersion: { type: DataTypes.STRING(256), allowNull: true },
                engineName: { type: DataTypes.STRING(256), allowNull: true },
                engineVersion: { type: DataTypes.STRING(256), allowNull: true },
                osName: { type: DataTypes.STRING(256), allowNull: true },
                osVersion: { type: DataTypes.STRING(256), allowNull: true },
                deviceModel: { type: DataTypes.STRING(256), allowNull: true },
                deviceType: { type: DataTypes.STRING(256), allowNull: true },
                deviceVendor: { type: DataTypes.STRING(256), allowNull: true },
                cpuArchitecture: { type: DataTypes.STRING(256), allowNull: true }
            },
            {
                // don't add the timestamp attributes (updatedAt, createdAt)
                timestamps: false,

                schema: "history",

                tableName: 'Agent'
            }
        );
    return definition;
};

module.exports = {
    model: model
};
