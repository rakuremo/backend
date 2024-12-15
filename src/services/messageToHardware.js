const convertMessageToHardware =
  {
    paramToHardware(timer, percent_opening_closing, time, sunday, monday, tuesday, wednesday, thursday, friday, saturday) {
      const timerP = timer;
      const percent_opening_closingP = percent_opening_closing;
      const timeP = time.replace(/:/g, '')
      let sundayP = "";
      if (sunday === "ON") {
        sundayP = "1";
      } else if (sunday === "OFF") {
        sundayP = "0";
      }
      let mondayP = monday;
      if (monday === "ON") {
        mondayP = "1";
      } else if (monday === "OFF") {
        mondayP = "0";
      }
      let tuesdayP = tuesday;
      if (tuesday === "ON") {
        tuesdayP = "1";
      } else if (tuesday === "OFF") {
        tuesdayP = "0";
      }
      let wednesdayP = wednesday;
      if (wednesday === "ON") {
        wednesdayP = "1";
      } else if (wednesday === "OFF") {
        wednesdayP = "0";
      }
      let thursdayP = thursday;
      if (thursday === "ON") {
        thursdayP = "1";
      } else if (thursday === "OFF") {
        thursdayP = "0";
      }
      let fridayP = friday;
      if (friday === "ON") {
        fridayP = "1";
      } else if (friday === "OFF") {
        fridayP = "0";
      }
      let saturdayP = saturday;
      if (saturday === "ON") {
        saturdayP = "1";
      } else if (saturday === "OFF") {
        saturdayP = "0";
      }
      const result = "T" + timerP + percent_opening_closingP + timeP + sundayP + mondayP + tuesdayP + wednesdayP + thursdayP + fridayP + saturdayP + "/";
      return result;
    },

    hardwareStatusToHardware(data) {
      if (data === "UP") {
        return "UP/";
      }
      if (data === "DN") {
        return "DN/";
      }
      if (data === "ST") {
        return "ST/";
      }
      if (data === "CF") {
        return "CF/";
      }
      if (data === "RS") {
        return "RS/";
      }
    },
    hardwareStatusGOToHardware(hardware_status, percent_opening_closing) {
      const result = hardware_status + percent_opening_closing + "/";
      return result;
    }
  }

module.exports = convertMessageToHardware;



