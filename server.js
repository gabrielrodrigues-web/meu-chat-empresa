const express = require('express');
const app = express();
const http = require('http').createServer(app);

// Suporte para arquivos de até 10MB (fotos e áudios)
const io = require('socket.io')(http, { 
    maxHttpBufferSize: 1e7 
});

app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
    console.log('Alguém entrou no chat!');

    socket.on('chat message', (msg) => {
        // Apenas repassa a mensagem recebida para todos os conectados
        io.emit('chat message', msg);
    });
});

const PORT = process.env.PORT || 10000;
http.listen(PORT, () => {
    console.log('CHAT ONLINE: Servidor rodando na porta ' + PORT);
});
