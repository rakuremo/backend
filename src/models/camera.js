

module.exports = (sequelize, DataTypes) => {
  const Camera = sequelize.define("camera", {
    id: {
      type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true
    },
    camera_name: {
      type: DataTypes.STRING(300), allowNull: false
    },
    camera_url: {
      type: DataTypes.STRING(300), allowNull: false
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
  return Camera
}