const express = require('express');
const app = express();
const http = require('http').createServer(app);
// ALTERADO: Adicionado maxHttpBufferSize para permitir envio de imagens/audios grandes
const io = require('socket.io')(http, { 
    cors: { origin: "*" },
    maxHttpBufferSize: 1e8 // 100 MB de limite para evitar desconexão ao enviar mídia
});

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
        const resto = Math.ceil((ipBanHistory[userIP].expires - now) / 60000);
        socket.emit('error message', `ACESSO NEGADO. Você ainda está banido por ${resto} min.`);
        socket.disconnect();
        return;
    }

    socket.on('login request', (data, callback) => {
        const cleanName = data.nickname.trim().substring(0, 10);
        const nameLower = cleanName.toLowerCase();
        const password = data.password;

        const isOnline = Object.values(connectedUsers).some(u => u.toLowerCase() === nameLower);
        
        if (userPasswords[nameLower]) {
            if (userPasswords[nameLower] !== password) {
                return callback({ success: false, message: "Senha incorreta para este apelido!" });
            }
        } else {
            userPasswords[nameLower] = password;
        }

        if (isOnline) {
            callback({ success: false, message: "Esse apelido já está online!" });
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

            delete userScores[targetName];
            delete reservedNames[targetLower];

            for (const [id, name] of Object.entries(connectedUsers)) {
                if (name.toLowerCase() === targetLower) {
                    const targetSocket = io.sockets.sockets.get(id);
                    if (targetSocket) {
                        const ip = targetSocket.handshake.address;
                        if (!ipBanHistory[ip]) ipBanHistory[ip] = { count: 0, expires: 0 };
                        ipBanHistory[ip].count++;

                        const banTime = ipBanHistory[ip].count === 1 ? 1 : (ipBanHistory[ip].count - 1) * 5;
                        ipBanHistory[ip].expires = Date.now() + (banTime * 60000);

                        const aviso = `🚨 SISTEMA: ${targetName} foi banido por ${banTime} minutos.`;
                        io.emit('chat message', { room: 'sky', user: '🛡️ ADMIN', text: aviso });
                        io.emit('chat message', { room: 'hell', user: '🛡️ ADMIN', text: aviso });

                        targetSocket.emit('error message', `Você foi banido por ${banTime} minutos.`);
                        targetSocket.disconnect();
                    }
                }
            }
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

    // O backend apenas repassa a mensagem (seja texto, img ou audio)
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
