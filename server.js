const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: { origin: "*" }
});

// CORREÇÃO: Define a pasta raiz como local dos arquivos (sem /public)
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
    console.log('Usuário conectado');

    socket.on('join room', (room) => {
        socket.leaveAll();
        socket.join(room);
        console.log('Usuário entrou na sala: ' + room);
    });

    socket.on('chat message', (msg) => {
        // Envia a mensagem apenas para a sala específica
        io.to(msg.room).emit('chat message', msg);
    });

    socket.on('disconnect', () => {
        console.log('Usuário desconectado');
    });
});

const PORT = process.env.PORT || 10000;
http.listen(PORT, () => {
    console.log('SERVIDOR RODANDO NA PORTA ' + PORT);
});
