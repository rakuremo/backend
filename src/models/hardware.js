
module.exports = (sequelize, DataTypes) => {
  const Hardware  = sequelize.define("hardware", {
    id: {
      type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true
    },
    ip: {
      type: DataTypes.STRING(10), allowNull: false, unique: true ,
      defaultValue: () => generateRandomId()
    },
    hardware_name: {
      type: DataTypes.STRING(300), allowNull: false,
    },
    hardware_address: {
      type: DataTypes.STRING(500), allowNull: false
    },
    status: {
      type: DataTypes.BOOLEAN, defaultValue: true
    },
    creator :{
      type: DataTypes.STRING(100), defaultValue: "admin" ,allowNull: false
    },
    status_set :{
      type: DataTypes.BOOLEAN, defaultValue: false
    },
    status_set_timer :{
      type: DataTypes.BOOLEAN, defaultValue: false
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
  return Hardware
}
function generateRandomId(length = 10) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters[randomIndex];
  }
  return result;
}
