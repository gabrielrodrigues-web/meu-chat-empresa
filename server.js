const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: { origin: "*" }
});

// Armazena usuários conectados: { socketId: "Apelido" }
const connectedUsers = {};

app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
    console.log('Usuário conectado');

    // NOVO: Verifica se o nome já existe antes de entrar
    socket.on('login request', (nickname, callback) => {
        const users = Object.values(connectedUsers);
        // Verifica se o nome existe (ignorando maiúsculas/minúsculas)
        const nameExists = users.some(user => user.toLowerCase() === nickname.toLowerCase());

        if (nameExists) {
            callback(false); // Nome proibido (já existe)
        } else {
            connectedUsers[socket.id] = nickname; // Salva o usuário
            callback(true); // Nome permitido
        }
    });

    socket.on('join room', (room) => {
        socket.leaveAll();
        socket.join(room);
        console.log('Usuário entrou na sala: ' + room);
    });

    socket.on('chat message', (msg) => {
        io.to(msg.room).emit('chat message', msg);
    });

    socket.on('disconnect', () => {
        console.log('Usuário desconectado: ' + connectedUsers[socket.id]);
        // Remove o nome da lista quando o usuário sai
        delete connectedUsers[socket.id];
    });
});

const PORT = process.env.PORT || 10000;
http.listen(PORT, () => {
    console.log('SERVIDOR RODANDO NA PORTA ' + PORT);
});
