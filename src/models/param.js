module.exports = (sequelize, DataTypes) => {
    const Param = sequelize.define("param", {
        id: {
            type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true
        },
        timer: {
            type: DataTypes.INTEGER(10), allowNull: false
        },
        percent_opening_closing: {
            type: DataTypes.STRING(10), allowNull: false
        },
        time :{
            type: DataTypes.STRING(10), allowNull: false
        },
        sunday: {
            type: DataTypes.STRING(10), defaultValue: false
        },
        monday: {
            type: DataTypes.STRING(10), defaultValue: false
        },
        tuesday: {
            type: DataTypes.STRING(10), defaultValue: false
        },
        wednesday: {
            type: DataTypes.STRING(10), defaultValue: false
        },
        thursday: {
            type: DataTypes.STRING(10), defaultValue: false
        },
        friday: {
            type: DataTypes.STRING(10), defaultValue: false
        },
        saturday: {
            type: DataTypes.STRING(10), defaultValue: false
        },
        data: {
            type: DataTypes.STRING(100), allowNull: true
        },
        status_set: {
            type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false
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
    return Param
}