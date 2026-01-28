const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, { 
    cors: { origin: "*" },
    maxHttpBufferSize: 1e8 // 100MB
});

const connectedUsers = {}; 
const userScores = {}; 
const userPasswords = {}; 
const ipBanHistory = {}; 
const ADMIN_PASSWORD = "050100@g"; 

app.use(express.static(__dirname));
app.get('/', (req, res) => res.sendFile(__dirname + '/index.html'));

function getEmoji(score) {
    if (score >= 1000) return " 👑";
    if (score >= 900) return " 💎";
    if (score >= 800) return " 🐉";
    if (score >= 700) return " 🔮";
    if (score >= 600) return " 🔱";
    if (score >= 500) return " 🛡️";
    if (score >= 400) return " ⚔️";
    if (score >= 300) return " ⚡";
    if (score >= 200) return " 🤡";
    if (score >= 100) return " 💩";
    return "";
}

io.on('connection', (socket) => {
    const userIP = socket.handshake.address;

    if (ipBanHistory[userIP] && Date.now() < ipBanHistory[userIP].expires) {
        socket.emit('error message', `ACESSO NEGADO.`);
        socket.disconnect();
        return;
    }

    socket.on('login request', (data, callback) => {
        if (!data || !data.nickname) return callback({ success: false });
        const cleanName = data.nickname.trim().substring(0, 10);
        const nameLower = cleanName.toLowerCase();
        
        if (userPasswords[nameLower] && userPasswords[nameLower] !== data.password) {
            return callback({ success: false, message: "Senha incorreta!" });
        }
        userPasswords[nameLower] = data.password;
        connectedUsers[socket.id] = cleanName;

        if (!userScores[cleanName]) userScores[cleanName] = { sky: 0, hell: 0 };
        callback({ success: true, scores: userScores[cleanName] });
    });

    socket.on('admin ban', (data) => {
        if (data.password === ADMIN_PASSWORD) {
            const targetLower = data.targetName.toLowerCase();
            Object.keys(userScores).forEach(n => { if(n.toLowerCase() === targetLower) delete userScores[n]; });
            for (const [id, name] of Object.entries(connectedUsers)) {
                if (name.toLowerCase() === targetLower) {
                    const ts = io.sockets.sockets.get(id);
                    if (ts) {
                        ipBanHistory[ts.handshake.address] = { expires: Date.now() + 600000 };
                        io.emit('chat message', { room: 'sky', user: '🛡️ ADMIN', text: `🚨 ${name} BANIDO!` });
                        io.emit('chat message', { room: 'hell', user: '🛡️ ADMIN', text: `🚨 ${name} BANIDO!` });
                        ts.disconnect();
                    }
                }
            }
            enviarRanking('sky'); enviarRanking('hell');
        }
    });

    socket.on('join room', (room) => { 
        socket.rooms.forEach(r => { if(r !== socket.id) socket.leave(r); });
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
        const name = connectedUsers[socket.id];
        if (!name) return;
        const score = userScores[name] ? userScores[name][msg.room] : 0;
        msg.user = name + getEmoji(score);
        io.to(msg.room).emit('chat message', msg);
    });

    socket.on('disconnect', () => { delete connectedUsers[socket.id]; });

    function enviarRanking(room) {
        const ranking = Object.keys(userScores)
            .map(name => {
                const s = userScores[name][room] || 0;
                return { name: name + getEmoji(s), score: s };
            })
            .filter(u => u.score > 0)
            .sort((a, b) => b.score - a.score).slice(0, 5);
        io.to(room).emit('update ranking', ranking);
    }
});

http.listen(process.env.PORT || 10000, () => console.log('BIPOLAR RODANDO'));
