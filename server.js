const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

// Faz o servidor entregar a página HTML
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Escuta quando alguém se conecta
io.on('connection', (socket) => {
    console.log('Alguém entrou no chat!');
    
    // Repassa a mensagem recebida para todo mundo
    socket.on('chat message', (msg) => {
        io.emit('chat message', msg);
    });
});

// Substitua as linhas 21 a 24 por estas:
const PORT = process.env.PORT || 3000;

http.listen(PORT, () => {
    console.log('CHAT ONLINE: Servidor rodando na porta ' + PORT);
});