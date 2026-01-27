const express = require('express');
const app = express();
const http = require('http').createServer(app);

// Permite fotos e áudios de até 10MB
const io = require('socket.io')(http, { 
    maxHttpBufferSize: 1e7 
});

const { GoogleGenerativeAI } = require("@google/generative-ai");

// Sua chave de API configurada
const MINHA_CHAVE = 'AIzaSyC55FiH5DEr8caVLPwc2Zxpfv_F1isQBEI'; 
const genAI = new GoogleGenerativeAI(MINHA_CHAVE);

// MODELO ALTERADO PARA A VERSÃO MAIS ESTÁVEL
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
    socket.on('chat message', async (msg) => {
        io.emit('chat message', msg);

        if (msg.text && msg.text.toLowerCase().includes('gemini')) {
            try {
                const prompt = msg.text.replace(/gemini/gi, '').trim();
                
                // Gera a resposta
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
                // Envia aviso de erro para o chat não ficar parado
                io.emit('chat message', {
                    user: "Sistema",
                    text: "Ops, o Gemini teve um soluço. Tente novamente!",
                    isGemini: true
                });
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log('SERVIDOR ATUALIZADO NA PORTA ' + PORT);
});
