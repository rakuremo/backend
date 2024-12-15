module.exports = (sequelize, DataTypes) => {
    const Received_Messages = sequelize.define("received_messages", {
        id: {
            type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true
        },
        message: {
            type: DataTypes.TEXT('long'),
            allowNull: false
        },
        data: {
            type: DataTypes.STRING(100), allowNull: false
        },
        createdAt: {
            type: DataTypes.DATE,
            defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
        },
        updatedAt: {
            type: DataTypes.DATE,
            defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
            onUpdate: sequelize.literal('CURRENT_TIMESTAMP')
        },
    }, {
        timestamps: false,
    });
    return Received_Messages;
};