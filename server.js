const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, { cors: { origin: "*" } });

const connectedUsers = {}; 
const userScores = {}; 
const bannedIPs = new Set(); 
const reservedNames = {}; // Guarda { "nome": timestamp_expiracao }

const ADMIN_PASSWORD = "050100@g"; 

app.use(express.static(__dirname));
app.get('/', (req, res) => res.sendFile(__dirname + '/index.html'));

io.on('connection', (socket) => {
    const userIP = socket.handshake.address;

    if (bannedIPs.has(userIP)) {
        socket.emit('error message', 'Você está banido deste servidor.');
        socket.disconnect();
        return;
    }

    socket.on('login request', (nickname, callback) => {
        const cleanName = nickname.trim().substring(0, 10);
        const now = Date.now();
        
        const isOnline = Object.values(connectedUsers).some(u => u.toLowerCase() === cleanName.toLowerCase());
        const isReserved = reservedNames[cleanName.toLowerCase()] && now < reservedNames[cleanName.toLowerCase()];

        if (isOnline || isReserved) {
            callback({ success: false, message: "Nome em uso ou reservado (aguarde 20min)." });
        } else if (cleanName.length < 2) {
            callback({ success: false, message: "Nome muito curto!" });
        } else {
            connectedUsers[socket.id] = cleanName;
            if (!userScores[cleanName]) userScores[cleanName] = { sky: 0, hell: 0 };
            callback({ success: true });
        }
    });

    socket.on('admin ban', (data) => {
        if (data.password !== ADMIN_PASSWORD) return;
        
        for (const [id, name] of Object.entries(connectedUsers)) {
            if (name.toLowerCase() === data.targetName.toLowerCase()) {
                const targetSocket = io.sockets.sockets.get(id);
                if (targetSocket) {
                    bannedIPs.add(targetSocket.handshake.address);
                    targetSocket.emit('error message', 'Você foi banido pelo administrador.');
                    targetSocket.disconnect();
                }
            }
        }
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

    socket.on('join room', (room) => {
        socket.leaveAll();
        socket.join(room);
        enviarRanking(room);
    });

    socket.on('disconnect', () => {
        const name = connectedUsers[socket.id];
        if (name) {
            // Reserva o nome por 20 minutos após sair
            reservedNames[name.toLowerCase()] = Date.now() + (20 * 60 * 1000);
            delete connectedUsers[socket.id];
        }
    });

    function enviarRanking(room) {
        const ranking = Object.keys(userScores)
            .map(name => ({ name, score: userScores[name][room] || 0 }))
            .filter(u => u.score > 0)
            .sort((a, b) => b.score - a.score).slice(0, 5);
        io.to(room).emit('update ranking', ranking);
    }
});

const PORT = process.env.PORT || 10000;
http.listen(PORT, () => console.log('SERVIDOR RODANDO NA PORTA ' + PORT));
