const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, { 
    cors: { origin: "*" },
    maxHttpBufferSize: 1e7 
});

// CORREÇÃO: Define a pasta principal como local dos arquivos
app.use(express.static(__dirname));

// Garante que o index.html seja entregue corretamente
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
    console.log('Usuário conectado ao Socket.io');

    socket.on('join room', (room) => {
        socket.leaveAll();
        socket.join(room);
        console.log('Usuário entrou na sala: ' + room);
    });

    socket.on('chat message', (msg) => {
        // Envia para todos na sala específica
        io.to(msg.room).emit('chat message', msg);
    });

    socket.on('disconnect', () => {
        console.log('Usuário desconectado');
    });
});

// Porta dinâmica para o Render (10000) ou local (3000)
const PORT = process.env.PORT || 10000;
http.listen(PORT, () => {
    console.log('SERVIDOR ELITE RODANDO NA PORTA ' + PORT);
});
