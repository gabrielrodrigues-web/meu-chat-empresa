const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
  maxHttpBufferSize: 1e7 // Permite enviar arquivos de até 10MB (Imagens e Áudio)
});
const { GoogleGenerativeAI } = require("@google/generative-ai");

// --- AIzaSyC55FiH5DEr8caVLPwc2Zxpfv_F1isQBEI ---
const MINHA_CHAVE = 'COLE_AQUI_A_SUA_CHAVE_DO_PRINT'; 
const genAI = new GoogleGenerativeAI(MINHA_CHAVE);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

app.use(express.static(__dirname + '/public'));

io.on('connection', (socket) => {
    socket.on('chat message', async (msg) => {
        // Envia a mensagem (texto, imagem ou áudio) para todos no chat
        io.emit('chat message', msg);

        // Se você escrever "gemini", o robô responde
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
                console.error("Erro ao chamar o Gemini:", erro);
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Servidor rodando!`);
});

