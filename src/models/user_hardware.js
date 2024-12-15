

module.exports = (sequelize, DataTypes) => {
  const User_Hardware = sequelize.define("user_hardware", {
    id: {
      type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER, allowNull: false
    },
    hardware_id: {
      type: DataTypes.INTEGER, allowNull: false
    },
    hardware_status :{
      type: DataTypes.STRING(200), allowNull: true
    },
    percent_opening_closing: {
      type: DataTypes.STRING(10), allowNull: true
    },
    status_set :{
      type: DataTypes.INTEGER, defaultValue: 2, allowNull: false
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
  return User_Hardware

}