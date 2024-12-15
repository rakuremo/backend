

module.exports = (sequelize, DataTypes) => {
  const Hardware_Status = sequelize.define("hardware_status", {
    id: {
      type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true
    },
    receiving_status: {
      type: DataTypes.STRING(300), allowNull: false
    },
    engine_status: {
      type: DataTypes.STRING(300), allowNull: false
    },
    hardware_voltage: {
      type: DataTypes.STRING(20), allowNull: false
    },
    percent_opening_closing: {
      type: DataTypes.STRING(10), allowNull: false
    },
    overload_state :{
      type: DataTypes.STRING(100), allowNull: false
    },
    controller_error:{
      type: DataTypes.STRING(100), allowNull: false
    },
    time: {
      type: DataTypes.STRING(100), allowNull: false
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
  return Hardware_Status

}