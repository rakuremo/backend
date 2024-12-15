//viet function
const ReceivingStatus = ["Bất thường", "Bình thường, sẵn sàng", "Đang cài đặt phần cứng", "Đang khôi phục lại dữ liệu phần cứng ( sau khi mất và có điện lại…)"];
const EngineStatus = ["STOP", "UP", "DOWN"];
const OverloadState = ["Bình thường", "Quá tải", "Quá tải"]
const ControllerError = ["Bình thường", "Lỗi"]
const OnOff = ["OFF", "ON"]

const alertService = {
  hardwareStatusToServer(data) {
    const receivingStatus = ReceivingStatus[Number(data.charAt(0))];
    const engineStatus = EngineStatus[Number(data.charAt(1))];
    const hardwareVoltage = Number(data.slice(2, 4)) + "." + data.slice(4, 5);
    const percentOpeningClosing = Number(data.slice(5, 8)) + "." + data.slice(8, 9);
    const overloadState = OverloadState[Number(data.charAt(9))];
    const controllerError = ControllerError[Number(data.charAt(10))];
    const hour = data.slice(11, 13);
    const minute = data.slice(13, 15);
    const second = data.slice(15, 17);
    const time = hour + ":" + minute + ":" + second;
    return {
      receivingStatus,
      engineStatus,
      hardwareVoltage,
      percentOpeningClosing,
      overloadState,
      controllerError,
      time
    };
  },
  sendParamInformationToServer(data) {
    const timer = data.charAt(1);
    const percentOpeningClosing = Number(data.slice(2, 5)) + "." + data.slice(5, 6);
    const hour = data.slice(6, 8);
    const minute = data.slice(8, 10);
    const time = hour + ":" + minute;
    const sunday = OnOff[Number(data.charAt(10))];
    const monday = OnOff[Number(data.charAt(11))];
    const tuesday = OnOff[Number(data.charAt(12))];
    const wednesday = OnOff[Number(data.charAt(13))];
    const thursday = OnOff[Number(data.charAt(14))];
    const friday = OnOff[Number(data.charAt(15))];
    const saturday = OnOff[Number(data.charAt(16))];
    return {
      timer,
      percentOpeningClosing,
      time,
      sunday,
      monday,
      tuesday,
      wednesday,
      thursday,
      friday,
      saturday
    };
  },

  messageReceivedToServer(data) {
    const message = data.slice(1, data.length);
    return {message}
  }
}

module.exports = alertService;