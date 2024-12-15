const mqtt = require("mqtt");
const db = require('../models');
const Hardware = db.hardware;
const Param = db.param;
const ReceivedMessages = db.received_messages;
const Hardware_Status = db.hardware_status;
const alertService = require("./alertServices");

const client = mqtt.connect("mqtt://localhost:1883");

const subscribeToTopics = async () => {
  try {
    await client.subscribe("#");
    console.log("Subscribed to all topics");
  } catch (err) {
    console.error("Failed to subscribe:", err);
  }
};

const handleMessage = async (topic, message) => {
  try {
    const messageContent = message.toString();
    if (topic.length > 11) {
      console.log(`Received message from topic ${topic}: ${messageContent}`);
      await addData(topic, messageContent);
      const hardware_ip = topic.slice(0, 10);
      const hardware = await Hardware.findOne({where: {ip: hardware_ip}});
      if (hardware) {
        // 1 timer
        if (messageContent.charAt(0) === 'T') {
          await global.io.emit('notification', {
            topic: hardware.id,
            message: 1
          });
        } else if (messageContent.charAt(0) === 'M') {
          // 2 message
          await global.io.emit('notification', {
            topic: hardware.id,
            message: 2
          });
        } else if (!isNaN(parseInt(messageContent.charAt(0), 10))) {
          // 3 hardware status
          await global.io.emit('notification', {
            topic: hardware.id,
            message: 3
          });
        }
      }
    }
  } catch (e) {
    console.error("Error occurred:", e);
    throw e;
  }
}
const addData = async (topic, data) => {
  try {
    const hardware_ip = topic.slice(0, 10)
    const hardware = await Hardware.findOne({where: {ip: hardware_ip}});
    if (!hardware) {
      return;
    }
    let result;
    if (data.charAt(0) === 'T' && data.length === 18) {
      result = await handleParamData(data, hardware);
    } else if (data.charAt(0) === 'M') {
      result = await handleMessageData(data, hardware);
    } else if (!isNaN(parseInt(data.charAt(0), 10)) && data.length === 18) {
      result = await handleHardwareStatusData(data, hardware);
    }

    return result;
  } catch (e) {
    console.error("Error occurred:", e);
  }
};

const handleParamData = async (data, hardware) => {
  const param = await alertService.sendParamInformationToServer(data);
  return await Param.create({
    timer: param.timer,
    percent_opening_closing: param.percentOpeningClosing,
    time: param.time,
    sunday: param.sunday,
    monday: param.monday,
    tuesday: param.tuesday,
    wednesday: param.wednesday,
    thursday: param.thursday,
    friday: param.friday,
    saturday: param.saturday,
    hardware_id: hardware.id,
    data: data,
  });
};

const handleMessageData = async (data, hardware) => {
  const message = await alertService.messageReceivedToServer(data);
  return await ReceivedMessages.create({
    message: message.message,
    hardware_id: hardware.id,
    data: data,
  });
};

const handleHardwareStatusData = async (data, hardware) => {
  const hardwareStatus = await alertService.hardwareStatusToServer(data);
  return await Hardware_Status.create({
    receiving_status: hardwareStatus.receivingStatus,
    engine_status: hardwareStatus.engineStatus,
    hardware_voltage: hardwareStatus.hardwareVoltage,
    percent_opening_closing: hardwareStatus.percentOpeningClosing,
    overload_state: hardwareStatus.overloadState,
    controller_error: hardwareStatus.controllerError,
    time: hardwareStatus.time,
    hardware_id: hardware.id,
    data: data,
  });
};

client.on("connect", subscribeToTopics);
client.on("message", handleMessage);

process.on('SIGINT', () => {
  client.end(() => {
    console.log('MQTT client đã ngắt kết nối');
    process.exit(0);
  });
});

const sendMessage = (topic, message) => {
  client.publish(topic, message, (err) => {
    if (err) {
      console.error("Failed to send message:", err);
    } else {
      console.log(`Message sent to topic ${topic}: ${message}`);
    }
  });
};

module.exports = {
  client,
  sendMessage,
  subscribeToTopics
};