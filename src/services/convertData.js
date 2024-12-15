const convertData = {
  convert: (data) => {
    if (data === "DN") {
      return "Đóng máy";
    } else if (data === "UP") {
      return "Mở máy";
    } else if (data === "ST") {
      return "Dừng máy";
    } else if (data === "CF") {
      return "Yêu cầu phản hồi";
    } else if (data === "RS") {
      return "Reset lỗi";
    } else if (data === "GO") {
      return "Yêu cầu phần trăm đóng/mở cửa";
    }
  },
  converpercent: (data) => {
    if (data === 100) {
      return "1000";
    } else if (data === 0) {
      return "0000";
    } else if (data >= 10) {
      const result = data * 10
      return "0" + result;
    } else {
      const result = data * 10
      return "00" + result;
    }
  }
};

module.exports = convertData;