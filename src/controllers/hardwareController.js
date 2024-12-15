const db = require("../models");
const Hardware = db.hardware;
const Camera = db.camera;
const Yup = require("yup");
const {Op} = require("sequelize");
const User = db.user;
const Hardware_Status = db.hardware_status;
const Received_Messages = db.received_messages;
const Param = db.param;
const User_Hardware = db.user_hardware;


const createHardware = async (req, res) => {
  try {
    const admin_id = req.userId;
    const schema = Yup.object().shape({
      hardware_name: Yup.string().required(),
      hardware_address: Yup.string().required(),
      cameras: Yup.array().of(Yup.object().shape({
        camera_name: Yup.string().required(),
        camera_url: Yup.string().required()
      }))

    });
    if (!(await schema.isValid(req.body))) {
      const errors = await schema.validate(req.body, {abortEarly: false}).catch(err => err);
      return res.status(400).json({
        statusCode: 400,
        message: errors.errors,
      });
    }
    const user = await User.findByPk(admin_id);
    if (!user) {
      return res.status(404).json({
        statusCode: 404,
        message: "User not found",
      });
    }
    const {hardware_name, hardware_address, cameras} = req.body;
    const hardware = await Hardware.create({
      hardware_name,
      hardware_address,
      creator: user.name
    });
    const cameraPromises = cameras.map(({camera_name, camera_url}) =>
      Camera.create({
        camera_name,
        camera_url,
        hardware_id: hardware.id,
      })
    );
    const camerasData = await Promise.all(cameraPromises);
    return res.status(201).json({
      statusCode: 201,
      message: "OK",
      date: {
        hardware,
        camerasData
      }
    });
  } catch (e) {
    console.error("Error occurred:", e);
    return res.status(500).json({
      statusCode: 500,
      message: 'Internal Server Error',
      error: e.message || e
    });
  }

}

const updateHardware = async (req, res) => {
  try {
    const schema = Yup.object().shape({
      hardware_name: Yup.string().required(),
      hardware_address: Yup.string().required(),
      cameras: Yup.array().of(Yup.object().shape({
        camera_name: Yup.string().required(),
        camera_url: Yup.string().required()
      }))
    });

    if (!(await schema.isValid(req.body))) {
      const errors = await schema.validate(req.body, {abortEarly: false}).catch(err => err);
      return res.status(400).json({
        statusCode: 400,
        message: errors.errors,
      });
    }

    const {id} = req.params;
    const {hardware_name, hardware_address, cameras} = req.body;

    const hardware = await Hardware.findByPk(id);
    if (!hardware) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Hardware not found',
      });
    }

    await Camera.destroy({
      where: {
        hardware_id: id,
      }
    });

    const cameraPromises = cameras.map(({camera_name, camera_url}) =>
      Camera.create({
        camera_name,
        camera_url,
        hardware_id: hardware.id,
      })
    );

    const camerasData = await Promise.all(cameraPromises);
    hardware.hardware_name = hardware_name;
    hardware.hardware_address = hardware_address;
    hardware.updatedAt = new Date();
    await hardware.save();
    return res.status(200).json({
      statusCode: 200,
      message: "OK",
      data: {
        hardware,
        camerasData
      }
    });
  } catch (e) {
    console.error("Error occurred:", e);
    return res.status(500).json({
      statusCode: 500,
      message: 'Internal Server Error',
      error: e.message || e
    });
  }
};

const getByHardwareWithCamare = async (req, res) => {
  try {
    const {id} = req.params;
    const hardware = await Hardware.findByPk(id, {
      include: Camera
    });
    if (!hardware) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Hardware not found',
      });
    }
    return res.status(200).json({
      statusCode: 200,
      message: "OK",
      data: hardware
    });
  } catch (e) {
    console.error("Error occurred:", e);
    return res.status(500).json({
      statusCode: 500,
      message: 'Internal Server Error',
      error: e.message || e
    });
  }
}

const getLogHardware = async (req, res) => {
  try {
    const {id} = req.params;
    const hardwareStatusCurrentPromise = await Hardware_Status.findOne({
      where: {
        hardware_id: id,
      },
      order: [['createdAt', 'DESC']],
      limit: 1
    });
    const paramPromise = await Param.findOne({
      where: {
        hardware_id: id,
      },
      order: [['createdAt', 'DESC']],
      limit: 1
    });

    const receivedMessagesPromise = await Received_Messages.findAll({
      where: {
        hardware_id: id,
      },
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    const [hardwareStatusCurrent, paramCurrent, receivedMessagesTop10] = await Promise.all([hardwareStatusCurrentPromise, paramPromise, receivedMessagesPromise]);

    return res.status(200).json({
      statusCode: 200,
      message: "OK",
      data: {hardwareStatusCurrent, paramCurrent, receivedMessagesTop10}
    });
  } catch (e) {
    console.error("Error occurred:", e);
    return res.status(500).json({
      statusCode: 500,
      message: 'Internal Server Error',
      error: e.message || e
    });
  }
}

const getHardwareStatusById = async (req, res) => {
  try {
    const {id} = req.params;
    const hardwareStatus = await Hardware_Status.findOne({
      where: {
        hardware_id: id,
      },
      order: [['createdAt', 'DESC']],
      limit: 1
    });
    if (!hardwareStatus) {
      return res.status(200).json({
        statusCode: 200,
        message: 'Hardware status not found',
        data: []
      });
    }
    return res.status(200).json({
      statusCode: 200,
      message: "OK",
      data: hardwareStatus
    });
  } catch (e) {
    console.error("Error occurred:", e);
    return res.status(500).json({
      statusCode: 500,
      message: 'Internal Server Error',
      error: e.message || e
    });
  }

}

const getLogUserActiveHardware = async (req, res) => {
  try {
    const {id} = req.params;
    const schema = Yup.object().shape({
      limit: Yup.number()
        .required('Limit is required')
        .min(0, 'Limit must be greater than or equal to 0'), // Giới hạn limit phải >= 0
      page: Yup.number()
        .required('Page is required')
        .min(1, 'Page must be greater than or equal to 0'),  // Giới hạn page phải >= 0
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
    const userHardware = await User_Hardware.findAll({
      where: {
        hardware_id: id,
        hardware_status: {
          // Điều kiện để hardware_status không phải là NULL
          [Op.ne]: null,
        }
      },
      include: [
        {
          model: User,
          attributes: ['name']
        }
      ],
      order: [
        ['createdAt', 'DESC']
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
    const count = await User_Hardware.count({
      where: {
        hardware_id: id,
        hardware_status: {
          [Op.ne]: null,
        }
      }
    });
    if (!userHardware) {
      return res.status(200).json({
        statusCode: 404,
        message: "User Hardware not found",
        data: []
      });
    }
    const dataResults = userHardware.map((item) => {
      let message = " "
      if (item.status_set === 1) {
        message = item.hardware_status + " " + "thành công"
      } else if (item.status_set === 0) {
        message = item.hardware_status + " " + "thất bại"
      } else if (item.status_set === 2) {
        message = item.hardware_status + " " + "đang thực hiện"
      }
      return {
        time_action: item.createdAt,
        user_name: item.user.name,
        user_action: message
      }
    });
    const totalPages = Math.ceil(count / limit);
    const total = count;
    return res.status(200).json({
      statusCode: 200,
      message: "OK",
      data: dataResults, totalPages, total
    });
  } catch (e) {
    console.error("Error occurred:", e);
    return res.status(500).json({
      statusCode: 500,
      message: 'Internal Server Error',
      error: e.message || e
    });
  }
}

const get30message = async (req, res) => {
  try {
    const {id} = req.params;
    const receivedMessages = await Received_Messages.findAll({
      where: {
        hardware_id: id,
      },
      order: [['createdAt', 'DESC']],
      limit: 30
    });
    if (!receivedMessages) {
      return res.status(200).json({
        statusCode: 200,
        message: 'Received messages not found',
        data: []
      });
    }
    const dataResults = receivedMessages.map((item) => {
      return {
        time: item.createdAt,
        message: item.message
      }
    });
    return res.status(200).json({
      statusCode: 200,
      message: "OK",
      data: dataResults
    });
  } catch (e) {
    console.error("Error occurred:", e);
    return res.status(500).json({
      statusCode: 500,
      message: 'Internal Server Error',
      error: e.message || e
    });
  }

}
module.exports = {
  createHardware,
  updateHardware,
  getByHardwareWithCamare,
  getLogHardware,
  getHardwareStatusById,
  getLogUserActiveHardware,
  get30message

}


