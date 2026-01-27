const express = require('express');
const app = express();
const http = require('http').createServer(app);

// Configuração para suportar arquivos de até 10MB (Imagens e Áudios)
const io = require('socket.io')(http, { 
    maxHttpBufferSize: 1e7 
});

const { GoogleGenerativeAI } = require("@google/generative-ai");

// Sua chave de API do Gemini
const MINHA_CHAVE = 'AIzaSyC55FiH5DEr8caVLPwc2Zxpfv_F1isQBEI'; 
const genAI = new GoogleGenerativeAI(MINHA_CHAVE);

// MODELO CORRIGIDO: Removido o "-latest" que causou o erro 404
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
    socket.on('chat message', async (msg) => {
        // 1. Repassa a mensagem original para todos no chat
        io.emit('chat message', msg);

        // 2. Lógica do Gemini
        if (msg.text && msg.text.toLowerCase().includes('gemini')) {
            try {
                const prompt = msg.text.replace(/gemini/gi, '').trim() || "Olá!";
                
                // Chamada direta para o conteúdo
                const result = await model.generateContent(prompt);
                const response = await result.response;
                const text = response.text();

                io.emit('chat message', {
                    user: "Gemini_AI",
                    text: text,
                    mode: msg.mode,
                    isGemini: true
                });
            } catch (erro) {
                console.error("Erro no Gemini:", erro);
                // Envia aviso no chat se houver falha na API
                io.emit('chat message', {
                    user: "Sistema",
                    text: "Erro ao conectar com a IA. Verifique os logs.",
                    isGemini: true
                });
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log('CHAT ONLINE: Rodando na porta ' + PORT);
});
