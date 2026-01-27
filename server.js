const express = require('express');
const app = express();
const http = require('http').createServer(app);

// Permite o envio de arquivos maiores (fotos e áudios)
const io = require('socket.io')(http, { 
    maxHttpBufferSize: 1e7 
});

const { GoogleGenerativeAI } = require("@google/generative-ai");

// Sua chave de API do Gemini
const MINHA_CHAVE = 'AIzaSyC55FiH5DEr8caVLPwc2Zxpfv_F1isQBEI'; 
const genAI = new GoogleGenerativeAI(MINHA_CHAVE);

// MODELO ESTÁVEL: Ajustado para evitar o erro 404 visto nos seus logs
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
    socket.on('chat message', async (msg) => {
        // Envia a sua mensagem para todos no chat
        io.emit('chat message', msg);

        // Verifica se a mensagem contém a palavra "gemini"
        if (msg.text && msg.text.toLowerCase().includes('gemini')) {
            try {
                // LIMPEZA: Remove a palavra 'gemini' para enviar apenas a dúvida à IA
                const perguntaReal = msg.text.replace(/gemini/gi, '').trim();
                
                // Se você não escreveu nada após 'gemini', ele usa um padrão
                const promptFinal = perguntaReal || "Olá! Em que posso ajudar?";

                const result = await model.generateContent(promptFinal);
                const response = await result.response;
                const textoIA = response.text();

                // Envia a resposta da IA para o chat
                io.emit('chat message', {
                    user: "Gemini_AI",
                    text: textoIA,
                    mode: msg.mode,
                    isGemini: true
                });
            } catch (erro) {
                console.error("Erro no Gemini:", erro);
                io.emit('chat message', {
                    user: "Sistema",
                    text: "Erro ao processar sua pergunta. Tente novamente!",
                    isGemini: true
                });
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log('CHAT ONLINE: Servidor rodando na porta ' + PORT);
});
