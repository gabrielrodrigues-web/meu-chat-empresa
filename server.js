const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  console.log('User connected to secure TI line');
  socket.on('mensagem', (msg) => {
    io.emit('mensagem', msg);
  });
});

const PORT = process.env.PORT || 10000;
http.listen(PORT, () => {
  console.log('SECURITY PROTOCOL ACTIVE ON PORT ' + PORT);
});
