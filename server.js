const express = require('express');
const app = express();
const http = require('http').createServer(app);
// Esta linha permite que o chat envie fotos e áudios maiores
const io = require('socket.io')(http, { maxHttpBufferSize: 1e7 });
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Sua chave de API do Gemini
const MINHA_CHAVE = 'AIzaSyC55FiH5DEr8caVLPwc2Zxpfv_F1isQBEI'; 
const genAI = new GoogleGenerativeAI(MINHA_CHAVE);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Faz o servidor entregar o seu index.html
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
    socket.on('chat message', async (msg) => {
        // Envia a mensagem (texto, imagem ou áudio) para todos
        io.emit('chat message', msg);

        // Se a mensagem tiver "gemini", a IA responde
        if (msg.text && msg.text.toLowerCase().includes('gemini')) {
            try {
                const prompt = msg.text.replace(/gemini/gi, '');
                const result = await model.generateContent(prompt || "Olá!");
                const response = await result.response;
                
                io.emit('chat message', {
                    user: "Gemini_AI",
                    text: response.text(),
                    mode: msg.mode,
                    isGemini: true
                });
            } catch (erro) {
                console.error("Erro no Gemini:", erro);
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log('CHAT ONLINE: Servidor rodando na porta ' + PORT);
});

