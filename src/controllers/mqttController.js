const {client, subscribeToTopics} = require('../services/mqttServices');

const checkConnection = async (req, res) => {
  try {
    if (client.connected) {
      return res.status(200).json({
        statusCode: 200,
        message: "Connected to MQTT broker",
        connected: true
      });
    } else {
      return res.status(200).json({
        statusCode: 200,
        message: "Not connected to MQTT broker",
        connected: false
      });
    }
  } catch (err) {
    console.error("Error occurred:", err);
    return res.status(500).json({
      statusCode: 500,
      message: "Internal Server Error"
    });
  }
}

const resStartConnection = async (req, res) => {
  try {
    if (!client.connected) {
      return res.status(200).json({
        statusCode: 200,
        message: "Not connected to MQTT broker"
      });
    }
    await subscribeToTopics();
    return res.status(200).json({
      statusCode: 200,
      message: "Restarted connection to MQTT broker"
    });
  } catch (err) {
    console.error("Error occurred:", err);
    return res.status(500).json({
      statusCode: 500,
      message: "Internal Server Error"
    });
  }
}
module.exports = {checkConnection, resStartConnection};