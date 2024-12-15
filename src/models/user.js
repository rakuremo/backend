const bcrypt = require('bcrypt');


module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define("user", {
        id: {
            type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        username: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        password: {
            type: DataTypes.STRING(255), set(value) {
                const saltRounds = 10;
                const hashedPassword = bcrypt.hashSync(value, saltRounds);
                this.setDataValue('password', hashedPassword);
            }

        },
        role :{
            type: DataTypes.STRING(100), defaultValue: "user" ,allowNull: false
        },

        status: {
            type: DataTypes.BOOLEAN, defaultValue: true
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
    User.prototype.checkPassword = async function (newPassword) {
        try {
            const check = await bcrypt.compare(newPassword, this.password);
            return check;
        } catch (error) {
            console.log(error);
        }
    }
    return User
}

