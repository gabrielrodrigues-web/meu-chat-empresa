const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

// Isso faz o servidor ler o seu arquivo index.html
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  console.log('Alguém entrou no chat!');
  
  socket.on('mensagem', (msg) => {
    io.emit('mensagem', msg); // Manda a mensagem para todos
  });
});

// Usa a porta que o Render exige
const PORT = process.env.PORT || 10000;
http.listen(PORT, () => {
  console.log('CHAT ONLINE: Servidor rodando na porta ' + PORT);
});
