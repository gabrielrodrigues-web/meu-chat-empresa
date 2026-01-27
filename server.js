const express = require('express');
const app = express();
const http = require('http').createServer(app);

// Configuração para suportar arquivos de até 10MB (Imagens e Áudios)
const io = require('socket.io')(http, { 
    maxHttpBufferSize: 1e7 
});

const { GoogleGenerativeAI } = require("@google/generative-ai");

// Sua chave de API do Gemini (conforme visto em seus prints)
const MINHA_CHAVE = 'AIzaSyC55FiH5DEr8caVLPwc2Zxpfv_F1isQBEI'; 
const genAI = new GoogleGenerativeAI(MINHA_CHAVE);

// Ajustado para 'gemini-1.5-flash-latest' para evitar o erro 404 de versão
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

// Serve os arquivos da pasta 'public' (se houver) ou o index.html direto
app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
    console.log('Alguém entrou no chat!');

    socket.on('chat message', async (msg) => {
        // 1. Repassa a mensagem original (texto, imagem ou áudio) para todos no chat
        io.emit('chat message', msg);

        // 2. Lógica de resposta da IA Gemini
        if (msg.text && msg.text.toLowerCase().includes('gemini')) {
            try {
                // Remove a palavra 'gemini' do texto para enviar apenas a pergunta à IA
                const prompt = msg.text.replace(/gemini/gi, '').trim();
                
                const result = await model.generateContent(prompt || "Olá! Como posso ajudar?");
                const response = await result.response;
                const text = response.text();

                // Envia a resposta da IA de volta para o chat
                io.emit('chat message', {
                    user: "Gemini_AI",
                    text: text,
                    mode: msg.mode,
                    isGemini: true
                });
            } catch (erro) {
                console.error("Erro ao chamar o Gemini:", erro);
            }
        }
    });
});

// Porta configurada para o Render ou 3000 localmente
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log('CHAT ONLINE: Servidor rodando na porta ' + PORT);
});
