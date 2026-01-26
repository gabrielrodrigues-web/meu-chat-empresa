const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  console.log('Alguém entrou no chat GSO');
  
  socket.on('chat message', (msg) => {
    // Aqui ele repassa o balão, a cor, o usuário e o texto
    io.emit('chat message', msg);
  });

  socket.on('disconnect', () => {
    console.log('Alguém saiu');
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
