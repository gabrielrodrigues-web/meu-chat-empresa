const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, { maxHttpBufferSize: 1e7 });

app.use(express.static(__dirname + '/public'));

io.on('connection', (socket) => {
    // Usuário entra em um canal (padrão: amigavel)
    socket.on('join room', (room) => {
        socket.leaveAll();
        socket.join(room);
    });

    socket.on('chat message', (msg) => {
        // Envia apenas para as pessoas do mesmo canal
        io.to(msg.room).emit('chat message', msg);
    });
});

const PORT = process.env.PORT || 10000;
http.listen(PORT, () => console.log('Servidor em 2 canais na porta ' + PORT));
