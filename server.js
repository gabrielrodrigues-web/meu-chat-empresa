const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, { maxHttpBufferSize: 1e7 });

// Define que os arquivos estão na pasta principal
app.use(express.static(__dirname));

// FORÇA o envio do index.html ao abrir o site
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
    socket.on('join room', (room) => {
        socket.leaveAll();
        socket.join(room);
    });

    socket.on('chat message', (msg) => {
        io.to(msg.room).emit('chat message', msg);
    });
});

const PORT = process.env.PORT || 10000;
http.listen(PORT, () => console.log('Servidor dual rodando na porta ' + PORT));
