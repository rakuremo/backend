const express = require('express');
const bodyParser = require('body-parser');
require('express-async-handler');
require('dotenv').config();
const cors = require('cors');
const app = express();
const socketIo = require('socket.io');
const PORT = process.env.PORT;
require('./src/services/mqttServices');
const http = require('http');

app.use(cors({
  origin: '*'
}));
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// Routes
const authRouter = require('./src/routers/authRouter');
const adminRouter = require('./src/routers/adminRouter');
const userRouter = require('./src/routers/userRouter');
const mqttRouter = require('./src/routers/mqttRouter');

app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/user', userRouter);
app.use('/api/mqtt', mqttRouter);


const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
  }
});
global.io = io;

io.on('connection', (socket) => {
  console.log('A user connected');
  socket.join('notification')
})

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
})