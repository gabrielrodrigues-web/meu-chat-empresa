const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, { maxHttpBufferSize: 1e7 });

app.use(express.static(__dirname + '/public'));

io.on('connection', (socket) => {
    // Entra em um canal específico
    socket.on('join room', (room) => {
        socket.leaveAll();
        socket.join(room);
    });

    socket.on('chat message', (msg) => {
        // Envia a mensagem apenas para quem está no mesmo canal
        io.to(msg.room).emit('chat message', msg);
    });
});

const PORT = process.env.PORT || 10000;
http.listen(PORT, () => console.log('Servidor dual rodando na porta ' + PORT));
