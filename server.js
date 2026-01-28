const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, { cors: { origin: "*" } });

const connectedUsers = {}; 
const userScores = {}; 
const reservedNames = {}; 
const ipBanHistory = {}; // Guarda { count: 0, expires: 0 } por IP

const ADMIN_PASSWORD = "050100@g"; 

app.use(express.static(__dirname));
app.get('/', (req, res) => res.sendFile(__dirname + '/index.html'));

io.on('connection', (socket) => {
    const userIP = socket.handshake.address;
    const now = Date.now();

    // Verifica se o IP está cumprindo tempo de banimento
    if (ipBanHistory[userIP] && now < ipBanHistory[userIP].expires) {
        const resto = Math.ceil((ipBanHistory[userIP].expires - now) / 60000);
        socket.emit('error message', `Você está temporariamente bloqueado. Tente novamente em ${resto} minuto(s).`);
        socket.disconnect();
        return;
    }

    socket.on('login request', (nickname, callback) => {
        const cleanName = nickname.trim().substring(0, 10);
        const isOnline = Object.values(connectedUsers).some(u => u.toLowerCase() === cleanName.toLowerCase());
        const isReserved = reservedNames[cleanName.toLowerCase()] && now < reservedNames[cleanName.toLowerCase()];

        if (isOnline) {
            callback({ success: false, message: "Esse apelido já está em uso!" });
        } else if (isReserved) {
            callback({ success: false, message: "Nome reservado. Aguarde 1 hora." });
        } else {
            connectedUsers[socket.id] = cleanName;
            if (!userScores[cleanName]) userScores[cleanName] = { sky: 0, hell: 0 };
            callback({ success: true });
        }
    });

    socket.on('admin ban', (data) => {
        if (data.password === ADMIN_PASSWORD) {
            const targetName = data.targetName;
            const targetLower = targetName.toLowerCase();

            // 1. Remove pontos e reserva para sumir do ranking na hora
            delete userScores[targetName];
            delete reservedNames[targetLower];

            // 2. Procura o usuário online para pegar o IP e banir
            for (const [id, name] of Object.entries(connectedUsers)) {
                if (name.toLowerCase() === targetLower) {
                    const targetSocket = io.sockets.sockets.get(id);
                    if (targetSocket) {
                        const ip = targetSocket.handshake.address;
                        
                        // Lógica Progressiva:
                        if (!ipBanHistory[ip]) ipBanHistory[ip] = { count: 0, expires: 0 };
                        ipBanHistory[ip].count++;

                        let minutos = 0;
                        if (ipBanHistory[ip].count === 1) minutos = 1;
                        else minutos = (ipBanHistory[ip].count - 1) * 5;

                        ipBanHistory[ip].expires = Date.now() + (minutos * 60000);

                        targetSocket.emit('error message', `Banido! Você poderá voltar em ${minutos} min com outro nick.`);
                        targetSocket.disconnect();
                    }
                }
            }
            // Atualiza o ranking visual para todos
            enviarRanking('sky');
            enviarRanking('hell');
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

    socket.on('chat message', (msg) => io.to(msg.room).emit('chat message', msg));

    socket.on('disconnect', () => {
        const name = connectedUsers[socket.id];
        if (name) {
            reservedNames[name.toLowerCase()] = Date.now() + 3600000; 
            delete connectedUsers[socket.id];
        }
    });

    function enviarRanking(room) {
        const ranking = Object.keys(userScores)
            .map(name => ({ name, score: userScores[name][room] || 0 }))
            .filter(user => user.score > 0)
            .sort((a, b) => b.score - a.score).slice(0, 5);
        io.to(room).emit('update ranking', ranking);
    }
});

const PORT = process.env.PORT || 10000;
http.listen(PORT, () => console.log('SERVIDOR RODANDO NA PORTA ' + PORT));
