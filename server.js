const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  socket.on('mensagem', (msg) => {
    io.emit('mensagem', msg);
  });
});

const PORT = process.env.PORT || 10000;
http.listen(PORT, () => {
  console.log('CHAT ONLINE NA PORTA ' + PORT);
});
