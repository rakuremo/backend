const dbConfig = require('../config/dbConfig.js')
const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize(
  dbConfig.DB,
  dbConfig.USER,
  dbConfig.PASSWORD,
  {
    host: dbConfig.HOST,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: false,
    pool: {
      max: dbConfig.pool.max,
      min: dbConfig.pool.min,
      acquire: dbConfig.pool.acquire,
      idle: dbConfig.pool.idle
    }
  }
);
sequelize.authenticate()
    .then(() => {
        console.log('Connection has been established successfully.')

    })
    .catch(err => {
        console.error('Unable to connect to the database:', err)
    })

const db = {}
db.Sequelize = Sequelize
db.sequelize = sequelize

db.sequelize.sync({ alter: false })
  .then(() => {
    console.log('yes re-sync done!')
  })


db.user = require('./user.js')(sequelize, DataTypes)
db.param= require('./param.js')(sequelize, DataTypes)
db.received_messages = require('./received_messages.js')(sequelize, DataTypes)
db.hardware_status = require('./hardware_status.js')(sequelize, DataTypes)
db.hardware = require('./hardware.js')(sequelize, DataTypes)
db.user_hardware = require('./user_hardware.js')(sequelize, DataTypes)
db.camera = require('./camera.js')(sequelize, DataTypes)

// Relations
db.hardware.hasMany(db.hardware_status, { foreignKey: 'hardware_id', onUpdate: 'cascade', onDelete: 'cascade' })
db.hardware_status.belongsTo(db.hardware, { foreignKey: 'hardware_id', onUpdate: 'cascade', onDelete: 'cascade' })

db.hardware.hasMany(db.param, { foreignKey: 'hardware_id', onUpdate: 'cascade', onDelete: 'cascade' })
db.param.belongsTo(db.hardware, { foreignKey: 'hardware_id', onUpdate: 'cascade', onDelete: 'cascade' })

db.hardware.hasMany(db.received_messages, { foreignKey: 'hardware_id', onUpdate: 'cascade', onDelete: 'cascade' })
db.received_messages.belongsTo(db.hardware, { foreignKey: 'hardware_id' , onUpdate: 'cascade', onDelete: 'cascade' })

db.user.hasMany(db.user_hardware, { foreignKey: 'user_id', onUpdate: 'cascade', onDelete: 'cascade' })
db.user_hardware.belongsTo(db.user, { foreignKey: 'user_id', onUpdate: 'cascade', onDelete: 'cascade' })

db.hardware.hasMany(db.user_hardware, { foreignKey: 'hardware_id', onUpdate: 'cascade', onDelete: 'cascade' })
db.user_hardware.belongsTo(db.hardware, { foreignKey: 'hardware_id', onUpdate: 'cascade', onDelete: 'cascade' })

db.hardware.hasMany(db.camera, { foreignKey: 'hardware_id', onUpdate: 'cascade', onDelete: 'cascade' })
db.camera.belongsTo(db.hardware, { foreignKey: 'hardware_id', onUpdate: 'cascade', onDelete: 'cascade' })

db.user.hasMany(db.param, { foreignKey: 'user_id', onUpdate: 'cascade', onDelete: 'cascade' })
db.param.belongsTo(db.user, { foreignKey: 'user_id', onUpdate: 'cascade', onDelete: 'cascade' })


module.exports = db
