const db = require('../models');
const User = db.user;
const {Op} = require('sequelize');
const Yup = require("yup");
const User_Hardware = db.user_hardware;
const Hardware = db.hardware
const Param = db.param
const sequelize = db.sequelize
const Hardware_Status = db.hardware_status
const {paramToHardware, hardwareStatusToHardware, hardwareStatusGOToHardware} = require('../services/messageToHardware')
const {convert, converpercent} = require('../services/convertData')
const {sendMessage} = require('../services/mqttServices')

const getUserHardware = async (req, res) => {
  try {
    const userId = req.userId;
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
    console.log("userId = ", userId)
    if (!userId) {
      return res.status(400).json({
        statusCode: 400,
        message: "UserId is required",
      });
    }
    const user_hardwarePromise = User_Hardware.findAll({
      where: {
        user_id: userId,
        hardware_status: null,
      },
      attributes: ['hardware_id'],
      group: ['hardware_id'],
      include: [
        {
          model: Hardware,
          attributes: ['id', 'hardware_name', 'hardware_address', 'status', 'creator', 'createdAt', 'updatedAt'],
          required: true,
        },
      ],
      limit: limit,
      offset: offset,
    });
    const userHardwareCount = User_Hardware.count({
      where: {
        user_id: userId,
        hardware_status: null,
      },
      distinct: true,
      col: 'hardware_id',
    });
    const [count, user_hardware] = await Promise.all([userHardwareCount, user_hardwarePromise]);
    if (user_hardware.length === 0) {
      return res.status(200).json({
        statusCode: 200,
        message: "User Hardware Not Found",
        data: [],
      });
    }
    const hardwares = await Promise.all(user_hardware.map(async (item) => {
      const status_h = await Hardware_Status.findAll({
        where: {
          hardware_id: item.hardware.id,
        },
        order: [['createdAt', 'DESC']],
        limit: 1,
      });
      if (status_h.length === 0) {
        return {
          id: item.hardware.id,
          hardware_name: item.hardware.hardware_name,
          hardware_address: item.hardware.hardware_address,
          status: item.hardware.status,
          creator: item.hardware.creator,
          createdAt: item.hardware.createdAt,
          updatedAt: item.hardware.updatedAt,
          engine_status: "",
          percent_opening_closing: "",
        };
      } else {
        return {
          id: item.hardware.id,
          hardware_name: item.hardware.hardware_name,
          hardware_address: item.hardware.hardware_address,
          status: item.hardware.status,
          creator: item.hardware.creator,
          createdAt: item.hardware.createdAt,
          updatedAt: item.hardware.updatedAt,
          engine_status: status_h[0].engine_status,
          percent_opening_closing: status_h[0].percent_opening_closing,
        };
      }
    }));
    const totalPages = Math.ceil(count / limit);
    const total = count;
    return res.status(200).json({
      statusCode: 200,
      message: "OK",
      data: hardwares, totalPages, total
    });

  } catch (e) {
    console.log(e)
    return res.status(500).json({
      statusCode: 500,
      message: 'Internal Server Error',
    });
  }
}

const updateHardwareStatus = async (req, res) => {
  try {
    const userId = req.userId;
    const schema = Yup.object().shape({
      hardware_id: Yup.number().required(),
      hardware_status: Yup.string().oneOf(['DN', 'UP', 'ST', 'CF', 'RS', 'GO']).required(),
      percent_opening_closing: Yup.string().nullable(),
    });
    const {hardware_id, hardware_status, percent_opening_closing} = req.body;
    if (percent_opening_closing.length !== 0) {
      if (hardware_status !== "GO") {
        return res.status(400).json({
          statusCode: 400,
          message: "Hardware_status not equal GO so percent_opening_closing is null",
        });
      } else if (Number(percent_opening_closing) < 0 || Number(percent_opening_closing) > 100) {
        return res.status(400).json({
          statusCode: 400,
          message: "percent_opening_closing must be between 0 and 100",
        })
      }
      if (!(await schema.isValid(req.body))) {
        const errors = await schema.validate(req.body, {abortEarly: false}).catch(err => err);
        return res.status(400).json({
          statusCode: 400,
          message: errors.errors,
        });
      }
    } else {
      if (hardware_status === "GO") {
        return res.status(400).json({
          statusCode: 400,
          message: "percent_opening_closing is required",
        });
      }
    }
    const hardware = await Hardware.findOne({
      where: {
        id: hardware_id,
        status: true,
      },
    });
    if (!hardware) {
      return res.status(404).json({
        statusCode: 404,
        message: "Hardware Not Found",
      });
    }
    if (hardware.status_set === true) {
      return res.status(400).json({
        statusCode: 400,
        message: "Hardware is setting, please wait",
      });
    }
    hardware.status_set = true;
    await hardware.save();
    let percent_opening_closingRes = "";
    if (percent_opening_closing === "") {
      percent_opening_closingRes = null;
    } else {
      percent_opening_closingRes = percent_opening_closing;
    }
    const percent_opening_close = converpercent(+percent_opening_closingRes)
    const statusH = convert(hardware_status)
    const user_hardware = await User_Hardware.create({
      user_id: +userId,
      hardware_id: hardware.id,
      hardware_status: statusH,
      percent_opening_closing: percent_opening_closing,
    });
    let messages = "";
    if (hardware_status === "GO") {
      messages = hardwareStatusGOToHardware(hardware_status, percent_opening_close);
    } else {
      messages = hardwareStatusToHardware(hardware_status);
    }
    sendMessage(hardware.ip, messages);
    if (hardware_status === "CF" || hardware_status === "RS") {
      user_hardware.status_set = 1;
      hardware.status_set = false;
      await hardware.save();
      await user_hardware.save();
      return res.status(200).json({
        statusCode: 200,
        message: "Set Hardware Status Success",
        data: user_hardware,
      });
    }
    setTimeout(async () => {
      const time = new Date();
      const tenSecondsAgo = new Date(time.getTime() - 10 * 1000); // Subtract 10 seconds from the current time

      const hardware_st = await Hardware_Status.findAll({
        where: {
          hardware_id: hardware.id,
          createdAt: {
            [Op.between]: [tenSecondsAgo, time],
          }
        },
        order: [['createdAt', 'DESC']],
        limit: 1,
      });
      if (hardware_st.length > 0) {
        if ((hardware_status === "DN" && hardware_st[0].engine_status === "DOWN") ||
          (hardware_status === "UP" && hardware_st[0].engine_status === "UP") ||
          (hardware_status === "ST" && hardware_st[0].engine_status === "STOP") ||
          (hardware_status === "GO" && hardware_st[0].percent_opening_closing === percent_opening_closing)) {
          user_hardware.status_set = 1;
          hardware.status_set = false;
          await hardware.save();
          await user_hardware.save();
          return res.status(200).json({
            statusCode: 200,
            message: "Set Hardware Status Success",
            data: user_hardware,
          });
        } else {
          user_hardware.status_set = 0;
          hardware.status_set = false;
          await user_hardware.save();
          await hardware.save();
          return res.status(400).json({
            statusCode: 400,
            message: 'Set Hardware Status Fail',
          });
        }
      } else {
        user_hardware.status_set = 0;
        hardware.status_set = false;
        await hardware.save();
        await user_hardware.save();
        return res.status(400).json({
          statusCode: 400,
          message: 'Set Hardware Status Fail',
        });
      }
    }, 5000);
  } catch (e) {
    console.log(e)
    const h_ware_id = req.body.hardware_id;
    const hardware = await Hardware.findOne({
      where: {
        id: h_ware_id,
      },
    });
    hardware.status_set = false;
    await hardware.save();
    return res.status(500).json({
      statusCode: 500,
      message: 'Internal Server Error',
    });
  }
}

const updateHardwareParam = async (req, res) => {

  try {
    const userId = req.userId;
    const schema = Yup.object().shape({
      percent_opening_closing: Yup.string().required(),
      time: Yup.string().required().length(5),
      days: Yup.object().shape({
        sunday: Yup.string().oneOf(['ON', 'OFF']).required(),
        monday: Yup.string().oneOf(['ON', 'OFF']).required(),
        tuesday: Yup.string().oneOf(['ON', 'OFF']).required(),
        wednesday: Yup.string().oneOf(['ON', 'OFF']).required(),
        thursday: Yup.string().oneOf(['ON', 'OFF']).required(),
        friday: Yup.string().oneOf(['ON', 'OFF']).required(),
        saturday: Yup.string().oneOf(['ON', 'OFF']).required(),
      }).required(),
      hardware_id: Yup.number().required(),
    });
    const {percent_opening_closing, time, days, hardware_id} = req.body;
    if (Number(percent_opening_closing) < 0 || Number(percent_opening_closing) > 100) {
      return res.status(400).json({
        statusCode: 400,
        message: "percent_opening_closing must be between 0 and 100",
      })
    }
    if (!(await schema.isValid(req.body))) {
      const errors = await schema.validate(req.body, {abortEarly: false}).catch(err => err);
      return res.status(400).json({
        statusCode: 400,
        message: errors.errors,
      });
    }
    const hardwareCheck = await Hardware.findOne({
      where: {
        id: hardware_id,
        status: true,
      },
    });
    if (hardwareCheck.status_set_timer === true) {
      return res.status(400).json({
        statusCode: 400,
        message: "Hardware is creating a new timer, please wait",
      });
    }
    hardwareCheck.status_set_timer = true;
    await hardwareCheck.save();
    const params = await Param.findAll({
      where: {
        hardware_id: +hardware_id,
        status_set: true,
      },
      attributes: ['timer'],
      group: ['timer'],
    });
    if (params.length === 10) {
      hardwareCheck.status_set_timer = false;
      await hardwareCheck.save();
      return res.status(400).json({
        statusCode: 400,
        message: "Hardware has 10 params",
      });
    }

    const existingTimers = new Set(params.map((item) => item.timer));

    function generateUniqueTimer(existingTimers) {
      const availableTimers = [...Array(10).keys()];
      const filteredTimers = availableTimers.filter(timer => !existingTimers.has(timer));
      if (filteredTimers.length === 0) {
        throw new Error('Không còn timer khả dụng');
      }

      const min = Math.min(...filteredTimers);
      return min;
    }

    const newTimer = generateUniqueTimer(existingTimers);
    console.log('Timer mới:', newTimer);
    const user_hardware = await User_Hardware.findOne({
      where: {
        user_id: +userId,
        hardware_id: hardware_id,
      },
    });
    if (!user_hardware) {
      hardwareCheck.status_set_timer = false;
      await hardwareCheck.save();
      return res.status(404).json({
        statusCode: 404,
        message: "User Hardware Not Found",
      });
    }
    const percent_opening_close = converpercent(+percent_opening_closing)
    const paramResult = await Param.create({
      timer: newTimer,
      percent_opening_closing: percent_opening_closing,
      time: time,
      sunday: days.sunday,
      monday: days.monday,
      tuesday: days.tuesday,
      wednesday: days.wednesday,
      thursday: days.thursday,
      friday: days.friday,
      saturday: days.saturday,
      hardware_id: hardware_id,
      user_id: +userId,
    });
    const messages = paramToHardware(newTimer, percent_opening_close, time, days.sunday, days.monday, days.tuesday, days.wednesday, days.thursday, days.friday, days.saturday);
    console.log("messages = ", messages)
    const user_hardwareRs = await User_Hardware.create({
      user_id: +userId,
      hardware_id: hardwareCheck.id,
      hardware_status: "Cài đặt timer" + " " + newTimer,
      percent_opening_closing: percent_opening_closing,

    });
    sendMessage(hardwareCheck.ip, messages);

    setTimeout(async () => {
      const time = new Date();
      const tenSecondsAgo = new Date(time.getTime() - 10 * 1000); // Subtract 10 seconds from the current time
      const param = await Param.findAll({
        where: {
          hardware_id: hardwareCheck.id,
          createdAt: {
            [Op.between]: [tenSecondsAgo, time],
          },
          data: messages
        },
        order: [['createdAt', 'DESC']],
        limit: 1,
      });
      if (param.length > 0) {
        user_hardwareRs.status_set = 1;
        paramResult.status_set = true;
        hardwareCheck.status_set_timer = false;
        await Promise.all([
          user_hardwareRs.save(),
          paramResult.save(),
          hardwareCheck.save()
        ]);
        return res.status(200).json({
          statusCode: 200,
          message: "Create Hardware Param Success",
          data: paramResult,
        });
      } else {
        await paramResult.destroy();
        user_hardwareRs.status_set = 0;
        hardwareCheck.status_set_timer = false;
        await hardwareCheck.save();
        await user_hardwareRs.save();
        return res.status(400).json({
          statusCode: 400,
          message: 'Create Hardware Param Fail',
        });
      }
    }, 5000);
  } catch (e) {
    const h_ware_id = req.body.hardware_id;
    const hardware = await Hardware.findOne({
      where: {
        id: h_ware_id,
      },
    });
    hardware.status_set_timer = false;
    await hardware.save();
    return res.status(500).json({
      statusCode: 500,
      message: 'Internal Server Error',
    });
  }
}

const getUserByUserName = async (req, res) => {
  try {
    const schema = Yup.object().shape({
      username: Yup.string().required(),
    });
    if (!(await schema.isValid(req.body))) {
      const errors = await schema.validate(req.body, {abortEarly: false}).catch(err => err);
      return res.status(400).json({
        statusCode: 400,
        message: errors.errors,
      });
    }
    const {username} = req.body;
    const user = await User.findAll({
      where: {
        username: {
          [Op.like]: `%${username}%`,
        },
      },
    });
    if (!user) {
      return res.status(404).json({
        statusCode: 404,
        message: "User Not Found",
      });
    }
    return res.status(200).json({
      statusCode: 200,
      message: "OK",
      data: user,
    });
  } catch (e) {
    console.log(e)
    return res.status(500).json({
      statusCode: 500,
      message: 'Internal Server Error',
    });
  }
}

const getParamByHardwareId = async (req, res) => {
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
    const latestParams = await Param.findAll({
      where: {
        hardware_id: hardware_id,
        status_set: true,
      },
      order: [['updatedAt', 'DESC']],
      limit: 10,
    });
    if (!latestParams) {
      return res.status(200).json({
        statusCode: 200,
        message: "Param Not Found",
        data: [],
      });
    }
    const mapdata = latestParams.map((item) => {
      return {
        id: item.id,
        timer: item.timer,
        percent_opening_closing: item.percent_opening_closing,
        time: item.time,
        days: {
          sunday: item.sunday,
          monday: item.monday,
          tuesday: item.tuesday,
          wednesday: item.wednesday,
          thursday: item.thursday,
          friday: item.friday,
          saturday: item.saturday,
        },
        hardware_id: item.hardware_id,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,

      }
    });
    return res.status(200).json({
      statusCode: 200,
      message: "OK",
      data: mapdata,
    });
  } catch (e) {
    console.log(e)
    return res.status(500).json({
      statusCode: 500,
      message: 'Internal Server Error',
    });
  }
}

const updateParam = async (req, res) => {

  try {
    const id = req.params.id;
    const userId = req.userId;
    const schema = Yup.object().shape({
      percent_opening_closing: Yup.string().required(),
      time: Yup.string().required().length(5),
      days: Yup.object().shape({
        sunday: Yup.string().oneOf(['ON', 'OFF']).required(),
        monday: Yup.string().oneOf(['ON', 'OFF']).required(),
        tuesday: Yup.string().oneOf(['ON', 'OFF']).required(),
        wednesday: Yup.string().oneOf(['ON', 'OFF']).required(),
        thursday: Yup.string().oneOf(['ON', 'OFF']).required(),
        friday: Yup.string().oneOf(['ON', 'OFF']).required(),
        saturday: Yup.string().oneOf(['ON', 'OFF']).required(),
      }).required(),
      hardware_id: Yup.number().required(),
    });
    if (!(await schema.isValid(req.body))) {
      const errors = await schema.validate(req.body, {abortEarly: false}).catch(err => err);
      return res.status(400).json({
        statusCode: 400,
        message: errors.errors,
      });
    }
    const {percent_opening_closing, time, days, hardware_id} = req.body;
    if (Number(percent_opening_closing) < 0 || Number(percent_opening_closing) > 100) {
      return res.status(400).json({
        statusCode: 400,
        message: "percent_opening_closing must be between 0 and 100",
      });
    }
    const param = await Param.findOne({
      where: {
        id: id,
        hardware_id: hardware_id,
      },
    });
    if (!param) {
      return res.status(404).json({
        statusCode: 404,
        message: "Param Not Found",
      });
    }
    const hardware = await Hardware.findOne({
      where: {
        id: hardware_id,
        status: true,
      },
    });
    if (hardware.status_set_timer === true) {
      return res.status(400).json({
        statusCode: 400,
        message: "Hardware is updating timer, please wait",
      });
    }
    hardware.status_set_timer = true;
    await hardware.save();
    const percent_opening_close = converpercent(+percent_opening_closing);
    console.log("percent_opening_close = ", percent_opening_close);
    const messages = paramToHardware(param.timer, percent_opening_close, time, days.sunday, days.monday, days.tuesday, days.wednesday, days.thursday, days.friday, days.saturday);
    const user_hardwareRs = await User_Hardware.create({
      user_id: +userId,
      hardware_id: hardware.id,
      hardware_status: "Chỉnh sửa timer" + " " + param.timer,
      percent_opening_closing: percent_opening_closing,
    });
    sendMessage(hardware.ip, messages);
    setTimeout(async () => {
      const currentTime = new Date();
      const tenSecondsAgo = new Date(currentTime.getTime() - 10 * 1000); // Subtract 10 seconds from the current time

      const paramRS = await Param.findAll({
        where: {
          hardware_id: hardware.id,
          createdAt: {
            [Op.between]: [tenSecondsAgo, currentTime],
          },
          data: messages,
        },
        order: [['createdAt', 'DESC']],
        limit: 1,
      });
      if (paramRS.length > 0) {
        user_hardwareRs.status_set = 1;
        hardware.status_set_timer = false;
        param.status_set = true;
        param.updatedAt = new Date();
        param.percent_opening_closing = percent_opening_closing.toString();
        param.time = time;
        param.sunday = days.sunday;
        param.monday = days.monday;
        param.tuesday = days.tuesday;
        param.wednesday = days.wednesday;
        param.thursday = days.thursday;
        param.friday = days.friday;
        param.saturday = days.saturday;
        await Promise.all([
          user_hardwareRs.save(),
          param.save(),
          hardware.save(),
        ]);
        return res.status(200).json({
          statusCode: 200,
          message: "Update Hardware Param Success",
          data: param[0],
        });
      } else {
        user_hardwareRs.status_set = 0;
        hardware.status_set_timer = false;
        await hardware.save();
        await user_hardwareRs.save();
        return res.status(400).json({
          statusCode: 400,
          message: 'Update Hardware Param Fail',
        });
      }
    }, 5000);
  } catch (e) {
    console.log(e);
    const h_ware_id = req.body.hardware_id;
    const hardware = await Hardware.findOne({
      where: {
        id: h_ware_id,
      },
    });
    hardware.status_set_timer = false;
    await hardware.save();
    return res.status(500).json({
      statusCode: 500,
      message: 'Internal Server Error',
    });
  }
};

const deleteParam = async (req, res) => {
  try {
    const userId = req.userId;
    const id = req.params.id;
    const param = await Param.findOne({
      where: {
        id: id,
        status_set: true,
      },
    });
    if (!param) {
      return res.status(404).json({
        statusCode: 404,
        message: "Param Not Found",
      });
    }
    const user_hardwareRs = await User_Hardware.create({
      user_id: +userId,
      hardware_id: param.hardware_id,
      hardware_status: "Cài đặt timer" + " " + newTimer,
      percent_opening_closing: percent_opening_closing,

    });
    await param.destroy();
    return res.status(200).json({
      statusCode: 200,
      message: "OK",
    });
  } catch (e) {
    console.log(e)
    return res.status(500).json({
      statusCode: 500,
      message: 'Internal Server Error',
    });
  }
}


const sendCommand = async (req, res) => {
  const hardware_id = req.params.id;
  const userId = req.userId;
  const schema = Yup.object().shape({
    message: Yup.string().required(),
  });
  if (!(await schema.isValid(req.body))) {
    const errors = await schema.validate(req.body, {abortEarly: false}).catch(err => err);
    return res.status(400).json({
      statusCode: 400,
      message: errors.errors,
    });
  }
  const { message } = req.body;
  try {
    const hardware = await Hardware.findOne({
      where: {
        id: hardware_id,
        status: true,
      },
    });
    if (!hardware) {
      return res.status(404).json({
        statusCode: 404,
        message: "Hardware Not Found",
      });
    }
    sendMessage(hardware.ip, message)
    const statusH = "Gửi lệnh " + message + " thành công";
    await User_Hardware.create({
      user_id: +userId,
      hardware_id: +hardware_id,
      hardware_status: statusH,
      percent_opening_closing: null
    });
    return res.status(200).json({
      statusCode: 200,
      message: "OK",
    });
  } catch (e) {
    const statusH = "Gửi lệnh " + message + " thất bại";
    await User_Hardware.create({
      user_id: +userId,
      hardware_id: +hardware_id,
      hardware_status: statusH,
      percent_opening_closing: null
    });
    return res.status(500).json({
      statusCode: 500,
      message: 'Internal Server Error',
    });
  }
};
module.exports = {
  getUserHardware,
  updateHardwareStatus,
  updateHardwareParam,
  getUserByUserName,
  getParamByHardwareId,
  updateParam,
  deleteParam,
  sendCommand
}

