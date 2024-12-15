const db = require('../models');
const User = db.user;
const Camera = db.camera;
const {Op} = require("sequelize");
const User_Hardware = db.user_hardware;
const Hardware = db.hardware
const Yup = require("yup");


const getAllUsers = async (req, res) => {
  try {
    const schema = Yup.object().shape({
      limit: Yup.number().required(),
      page: Yup.number().required(),
    });
    if (!(await schema.isValid(req.body))) {
      const errors = await schema.validate(req.body, {abortEarly: false}).catch(err => err);
      return res.status(400).json({
        statusCode: 400,
        message: errors.errors,
      });
    }
    const {limit, page} = req.body;
    const offset = (page - 1) * limit;
    const usersPromise = User.findAll({
      where: {
        role: {
          [Op.ne]: 'admin'
        }
      },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
    const countPromise = User.count({
      where: {
        role: {
          [Op.ne]: 'admin'
        }
      }
    });
    const [users, count] = await Promise.all([usersPromise, countPromise]);

    if (users.length === 0) {
      return res.status(200).json({
        statusCode: 200,
        message: "Not Found",
        data: [],
      });
    }
    const totalPages = Math.ceil(count / limit);
    const total = count;
    return res.status(200).json({
      statusCode: 200,
      message: "OK",
      data: users, totalPages, total
    });
  } catch (e) {
    return res.status(500).json({
      statusCode: 500,
      message: 'Internal Server Error',
    });
  }
}

const getAllHardware = async (req, res) => {
  try {
    const schema = Yup.object().shape({
      limit: Yup.number().required(),
      page: Yup.number().required(),
    });
    if (!(await schema.isValid(req.body))) {
      const errors = await schema.validate(req.body, {abortEarly: false}).catch(err => err);
      return res.status(400).json({
        statusCode: 400,
        message: errors.errors,
      });
    }
    const {limit, page} = req.body;
    const offset = (page - 1) * limit;
    const hardwarePromise = Hardware.findAll({
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    })
    const countHardwarePromise = Hardware.count();
    const [hardwares, count] = await Promise.all([hardwarePromise, countHardwarePromise]);
    if (hardwares.length === 0) {
      return res.status(200).json({
        statusCode: 200,
        message: "Not Found",
        data: [],
      });
    }
    const totalPages = Math.ceil(count / limit);
    const total = count;
    return res.status(200).json({
      statusCode: 200,
      message: "OK",
      data: hardwares, totalPages, total
    });
  } catch (e) {
    return res.status(500).json({
      statusCode: 500,
      message: 'Internal Server Error',
    });
  }
}

const banUser = async (req, res) => {
  try {
    const schema = Yup.object().shape({
      userId: Yup.number().required(),
      status: Yup.boolean().required(),
    });
    if (!(await schema.isValid(req.body))) {
      const errors = await schema.validate(req.body, {abortEarly: false}).catch(err => err);
      return res.status(400).json({
        statusCode: 400,
        message: errors.errors,
      });
    }
    const {userId, status} = req.body;
    const user = await User.findOne({
      where: {
        id: userId
      }
    });
    if (!user) {
      return res.status(404).json({
        statusCode: 404,
        message: "Not Found",
      });
    }
    user.status = status;
    user.save();
    const {password, ...userData} = user.get();
    return res.status(200).json({
      statusCode: 200,
      message: "OK",
      data: userData
    });
  } catch (e) {
    return res.status(500).json({
      statusCode: 500,
      message: 'Internal Server Error',
    });
  }

}


const setUserWithHardware = async (req, res) => {
  try {
    const schema = Yup.object().shape({
      hardware_id: Yup.number().required(),
      users: Yup.array().of(
        Yup.object().shape({
          user_id: Yup.number().required(),
        })
      )
    });

    if (!(await schema.isValid(req.body))) {
      const errors = await schema.validate(req.body, {abortEarly: false}).catch(err => err);
      return res.status(400).json({
        statusCode: 400,
        message: errors.errors,
      });
    }

    const {users, hardware_id} = req.body;
    const hardware = await Hardware.findOne({where: {id: hardware_id}});

    if (!hardware) {
      return res.status(404).json({
        statusCode: 404,
        message: "Hardware Not Found",
      });
    }

    for (const {user_id} of users) {
      const user = await User.findOne({where: {id: user_id, status: true}});
      if (!user) {
        return res.status(404).json({
          statusCode: 404,
          message: "User Not Found",
        });
      }
      await User_Hardware.create({
        user_id: user_id,
        hardware_id: hardware_id,
      });
    }

    return res.status(200).json({
      statusCode: 200,
      message: "OK",
      data: "All user added successfully",
    });
  } catch (e) {
    console.error("Error:", e);
    return res.status(500).json({
      statusCode: 500,
      message: 'Internal Server Error',
    });
  }
};


const updateUserWithHardware = async (req, res) => {
  try {
    const {id} = req.params;
    const schema = Yup.object().shape({
      users: Yup.array().of(
        Yup.object().shape({
          user_id: Yup.number().required(),
        })
      )
    });
    if (!(await schema.isValid(req.body))) {
      const errors = await schema.validate(req.body, {abortEarly: false}).catch(err => err);
      return res.status(400).json({
        statusCode: 400,
        message: errors.errors,
      });
    }
    const {users} = req.body;
    const hardware = await Hardware.findOne({
      where: {
        id: id
      }
    });
    if (!hardware) {
      return res.status(404).json({
        statusCode: 404,
        message: "Hardware Not Found",
      });
    }
    const userPromiss = users.map(async ({user_id}) => {
      const user = await User.findOne({where: {id: user_id, status: true}});
      if (!user) {
        return res.status(404).json({
          statusCode: 404,
          message: "User Not Found",
        });
      }
      await User_Hardware.destroy({
        where: {
          hardware_id: id,
          user_id: user_id,
          hardware_status: null
        }
      });
    });
    const user_hardware = await Promise.all(userPromiss);
    return res.status(200).json({
      statusCode: 200,
      message: "OK",
    });
  } catch (e) {
    console.log(" err" + e)
    return res.status(500).json({
      statusCode: 500,
      message: 'Internal Server Error',
    });
  }
}

const addHardwareWithUser = async (req, res) => {
  try {
    const schema = Yup.object().shape({
      user_id: Yup.number().required(),
      hardwares: Yup.array().of(
        Yup.object().shape({
          hardware_id: Yup.number().required(),
        })
      )
    });

    if (!(await schema.isValid(req.body))) {
      const errors = await schema.validate(req.body, {abortEarly: false}).catch(err => err);
      return res.status(400).json({
        statusCode: 400,
        message: errors.errors,
      });
    }

    const {hardwares, user_id} = req.body;
    const user = await User.findOne({where: {id: user_id}});

    if (!user) {
      return res.status(404).json({
        statusCode: 404,
        message: "User Not Found",
      });
    }

    for (const {hardware_id} of hardwares) {
      const hardware = await Hardware.findOne({where: {id: hardware_id, status: true}});
      if (!hardware) {
        return res.status(404).json({
          statusCode: 404,
          message: "Hardware Not Found",
        });
      }
      await User_Hardware.create({
        user_id: user_id,
        hardware_id: hardware_id,
      });
    }

    return res.status(200).json({
      statusCode: 200,
      message: "All hardwares added successfully",
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({
      statusCode: 500,
      message: 'Internal Server Error',
    });
  }
}


const deleteHardwareWithUser = async (req, res) => {
  try {
    const {id} = req.params;
    const schema = Yup.object().shape({
      hardwares: Yup.array().of(
        Yup.object().shape({
          hardware_id: Yup.number().required(),
        })
      )
    });
    if (!(await schema.isValid(req.body))) {
      const errors = await schema.validate(req.body, {abortEarly: false}).catch(err => err);
      return res.status(400).json({
        statusCode: 400,
        message: errors.errors,
      });
    }
    const {hardwares} = req.body;
    const user = await User.findOne({
      where: {
        id: id
      }
    });
    if (!user) {
      return res.status(404).json({
        statusCode: 404,
        message: "User Not Found",
      });
    }
    const hardwarePromise = hardwares.map(async ({hardware_id}) => {
      const hardware = await Hardware.findOne({where: {id: hardware_id, status: true}});
      if (!hardware) {
        return res.status(404).json({
          statusCode: 404,
          message: `Hardware Not Found `,
        });
      }
      await User_Hardware.destroy({
        where: {
          hardware_id: hardware_id,
          user_id: id,
          hardware_status: null
        }
      });

    });
    const user_hardware = await Promise.all(hardwarePromise);
    return res.status(200).json({
      statusCode: 200,
      message: "OK",
    });
  } catch (e) {
    console.log(" err" + e)
    return res.status(500).json({
      statusCode: 500,
      message: 'Internal Server Error',
    });
  }
}

const getOneUser = async (req, res) => {
  try {
    const {id} = req.params;
    const user = await User.findOne({
      where: {
        id: id
      }
    });
    if (!user) {
      return res.status(404).json({
        statusCode: 404,
        message: "Not Found",
      });
    }
    const userHardware = await User_Hardware.findAll({
      where: {
        user_id: id,
        hardware_status: null
      },
      attributes: ['hardware_id'],
      group: ['hardware_id'],
      include: [
        {
          model: Hardware,
          attributes: ['hardware_name', 'hardware_address', 'status', 'creator', 'createdAt', 'updatedAt'],
          required: true,
        },
      ],
    });

    let user_hardware = [];
    if (userHardware.length !== 0) {
      user_hardware = userHardware.map(item => ({
        "hardware_id": item.hardware_id,
        "hardware_name": item.hardware.hardware_name,
        "hardware_address": item.hardware.hardware_address,
        "status": item.hardware.status,
        "creator": item.hardware.creator,
        "createdAt": item.hardware.createdAt,
        "updatedAt": item.hardware.updatedAt

      }));
    } else {
      user_hardware = [];

    }

    const {password, ...userData} = user.get();
    return res.status(200).json({
      statusCode: 200,
      message: "OK",
      data: userData, user_hardware
    });
  } catch (e) {
    console.log(" err" + e)
    return res.status(500).json({
      statusCode: 500,
      message: 'Internal Server Error',
    });
  }
}

const getOneHardware = async (req, res) => {
  try {
    const {id} = req.params;
    const hardware = await Hardware.findOne({
      where: {
        id: id
      },
      include: [
        {
          model: Camera,
        }
      ]
    });
    if (!hardware) {
      return res.status(404).json({
        statusCode: 404,
        message: "Not Found",
      });
    }
    const userHardware = await User_Hardware.findAll({
      where: {
        hardware_id: id,
        hardware_status: null
      },
      attributes: ['user_id'],
      group: ['user_id'],
      include: [
        {
          model: User,
          attributes: ['username', 'name', 'status', 'role', 'createdAt', 'updatedAt'],
          required: true,
        },
      ],
    });

    let user_hardware = [];
    if (userHardware.length !== 0) {
      user_hardware = userHardware.map(item => ({
        "user_id": item.user_id,
        "username": item.user.username,
        "name": item.user.name,
        "status": item.user.status,
        "role": item.user.role,
        "createdAt": item.user.createdAt,
        "updatedAt": item.user.updatedAt

      }));
    } else {
      user_hardware = [];
    }

    return res.status(200).json({
      statusCode: 200,
      message: "OK",
      data: hardware, user_hardware
    });
  } catch (e) {
    console.log(" err" + e)
    return res.status(500).json({
      statusCode: 500,
      message: 'Internal Server Error',
    });
  }

}

const getUserNoHardware = async (req, res) => {
  try {
    const schema = Yup.object().shape({
      limit: Yup.number().required(),
      page: Yup.number().required(),
      hardware_id: Yup.number().required(),
    });

    if (!(await schema.isValid(req.body))) {
      const errors = await schema.validate(req.body, {abortEarly: false}).catch(err => err);
      return res.status(400).json({
        statusCode: 400,
        message: errors.errors,
      });
    }

    const {limit, page, hardware_id} = req.body;
    const offset = (page - 1) * limit;

    // Fetch user IDs associated with the hardware
    const userHardware = await User_Hardware.findAll({
      where: {
        hardware_id: hardware_id,
        hardware_status: null
      },
      attributes: ['user_id'],
      group: ['user_id'],
    });

    const userIds = userHardware.map(uh => uh.user_id);

    // Fetch users not associated with these user IDs and not admins
    const users = await User.findAll({
      where: {
        id: {[Op.notIn]: userIds},
        role: {[Op.ne]: 'admin'},
      },
      order: [['createdAt', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    const count = await User.count({
      where: {
        id: {[Op.notIn]: userIds},
        role: {[Op.ne]: 'admin'},
      },
    });

    if (users.length === 0) {
      return res.status(200).json({
        statusCode: 200,
        message: "Not Found",
        data: [],
      });
    }

    const totalPages = Math.ceil(count / limit);

    return res.status(200).json({
      statusCode: 200,
      message: "OK",
      data: users,
      totalPages: totalPages,
      total: count,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({
      statusCode: 500,
      message: 'Internal Server Error',
    });
  }
};

const getHardwareNoUser = async (req, res) => {
  try {
    const schema = Yup.object().shape({
      limit: Yup.number().required(),
      page: Yup.number().required(),
      user_id: Yup.number().required(),
    });

    if (!(await schema.isValid(req.body))) {
      const errors = await schema.validate(req.body, {abortEarly: false}).catch(err => err);
      return res.status(400).json({
        statusCode: 400,
        message: errors.errors,
      });
    }

    const {limit, page, user_id} = req.body;
    const offset = (page - 1) * limit;

    // Fetch hardware IDs associated with the user
    const userHardware = await User_Hardware.findAll({
      where: {
        user_id: user_id,
        hardware_status: null
      },
      attributes: ['hardware_id'],
      group: ['hardware_id'],
    });
    const hardwareIds = userHardware.map(uh => uh.hardware_id);
    // Fetch hardwares not associated with these hardware IDs
    const hardwares = await Hardware.findAll({
      where: {
        id: {[Op.notIn]: hardwareIds},
      },
      order: [['createdAt', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    const count = await Hardware.count({
      where: {
        id: {[Op.notIn]: hardwareIds},
      },
    });

    if (hardwares.length === 0) {
      return res.status(200).json({
        statusCode: 200,
        message: "Not Found",
        data: [],
      });
    }
    const totalPages = Math.ceil(count / limit);
    return res.status(200).json({
      statusCode: 200,
      message: "OK",
      data: hardwares,
      totalPages: totalPages,
      total: count,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({
      statusCode: 500,
      message: 'Internal Server Error',
    });
  }
}

const resetStatusSetting = async (req, res) => {
  try {
    const schema = Yup.object().shape({
      hardware_id: Yup.number().required(),
    });
    if (!(await schema.isValid(req.body))) {
      const errors = await schema.validate(req.body, {abortEarly: false}).catch(err => err);
      return res.status(400).json({
        statusCode: 400,
        message: errors.errors,
      });
    }
    const {hardware_id} = req.body;
    const hardware = await Hardware.findOne({
      where: {id: hardware_id},
    });
    if (!hardware) {
      return res.status(404).json({
        statusCode: 404,
        message: "Hardware Not Found",
      });
    }
    hardware.status_set = false;
    hardware.status_set_timer = false;
    await hardware.save();
    return res.status(200).json({
      statusCode: 200,
      message: "OK",
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({
      statusCode: 500,
      message: 'Internal Server Error',
    });
  }
}

module.exports = {
  getAllUsers,
  getAllHardware,
  banUser,
  setUserWithHardware,
  updateUserWithHardware,
  addHardwareWithUser,
  deleteHardwareWithUser,
  getOneUser,
  getOneHardware,
  getUserNoHardware,
  getHardwareNoUser,
  resetStatusSetting

}