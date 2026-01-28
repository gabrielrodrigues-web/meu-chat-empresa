const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, { cors: { origin: "*" } });

const connectedUsers = {}; 
const userScores = {}; 

app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
    socket.on('login request', (nickname, callback) => {
        const users = Object.values(connectedUsers);
        const nameExists = users.some(u => u.toLowerCase() === nickname.toLowerCase());

        if (nameExists) {
            callback(false);
        } else {
            connectedUsers[socket.id] = nickname;
            if (!userScores[nickname]) userScores[nickname] = { sky: 0, hell: 0 };
            callback(true);
        }
    });

    socket.on('join room', (room) => {
        socket.leaveAll();
        socket.join(room);
        enviarRanking(room);
    });

    socket.on('update score', (data) => {
        const name = connectedUsers[socket.id];
        if (name && userScores[name]) {
            userScores[name][data.room]++;
            enviarRanking(data.room);
        }
    });

    socket.on('chat message', (msg) => {
        io.to(msg.room).emit('chat message', msg);
    });

    socket.on('disconnect', () => {
        delete connectedUsers[socket.id];
    });

    function enviarRanking(room) {
        const ranking = Object.keys(userScores)
            .map(name => ({ name, score: userScores[name][room] || 0 }))
            .filter(user => user.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);
        
        io.to(room).emit('update ranking', ranking);
    }
});

const PORT = process.env.PORT || 10000;
http.listen(PORT, () => console.log('SERVIDOR RODANDO NA PORTA ' + PORT));
