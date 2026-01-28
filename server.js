const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, { cors: { origin: "*" } });

const connectedUsers = {}; 
const userScores = {}; 
const reservedNames = {}; 
const userPasswords = {}; 
const ipBanHistory = {}; 

const ADMIN_PASSWORD = "050100@g"; 

app.use(express.static(__dirname));
app.get('/', (req, res) => res.sendFile(__dirname + '/index.html'));

io.on('connection', (socket) => {
    const userIP = socket.handshake.address;
    const now = Date.now();

    if (ipBanHistory[userIP] && now < ipBanHistory[userIP].expires) {
        socket.emit('error message', `BANIDO.`);
        socket.disconnect();
        return;
    }

    socket.on('login request', (data, callback) => {
        const cleanName = data.nickname.trim().substring(0, 10);
        const nameLower = cleanName.toLowerCase();
        if (userPasswords[nameLower] && userPasswords[nameLower] !== data.password) {
            return callback({ success: false, message: "Senha incorreta!" });
        }
        userPasswords[nameLower] = data.password;
        connectedUsers[socket.id] = cleanName;
        if (!userScores[cleanName]) userScores[cleanName] = { sky: 0, hell: 0 };
        callback({ success: true });
    });

    socket.on('chat message', (msg) => io.to(msg.room).emit('chat message', msg));

    socket.on('admin ban', (data) => {
        if (data.password === ADMIN_PASSWORD) {
            const targetLower = data.targetName.toLowerCase();
            delete userScores[data.targetName];
            for (const [id, name] of Object.entries(connectedUsers)) {
                if (name.toLowerCase() === targetLower) {
                    const ts = io.sockets.sockets.get(id);
                    if (ts) {
                        const ip = ts.handshake.address;
                        ipBanHistory[ip] = { expires: Date.now() + 60000 };
                        ts.disconnect();
                    }
                }
            }
            io.emit('update ranking', []); // Força atualização
        }
    });

    socket.on('join room', (room) => { socket.leaveAll(); socket.join(room); enviarRanking(room); });
    socket.on('update score', (data) => {
        const name = connectedUsers[socket.id];
        if (name && userScores[name]) { userScores[name][data.room]++; enviarRanking(data.room); }
    });

    function enviarRanking(room) {
        const ranking = Object.keys(userScores)
            .map(name => ({ name, score: userScores[name][room] || 0 }))
            .filter(u => u.score > 0)
            .sort((a, b) => b.score - a.score).slice(0, 5);
        io.to(room).emit('update ranking', ranking);
    }
});

http.listen(process.env.PORT || 10000);
