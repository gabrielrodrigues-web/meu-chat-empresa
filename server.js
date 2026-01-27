const express = require('express');
const app = express();
const http = require('http').createServer(app);

// Permite o envio de fotos e áudios maiores
const io = require('socket.io')(http, { 
    maxHttpBufferSize: 1e7 
});

const { GoogleGenerativeAI } = require("@google/generative-ai");

// Sua chave de API do Gemini
const MINHA_CHAVE = 'AIzaSyC55FiH5DEr8caVLPwc2Zxpfv_F1isQBEI'; 
const genAI = new GoogleGenerativeAI(MINHA_CHAVE);

// MODELO: Use exatamente assim para evitar o erro 404 do log
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
    socket.on('chat message', async (msg) => {
        // Envia sua mensagem para a tela do chat
        io.emit('chat message', msg);

        // Se a mensagem tiver a palavra "gemini", a IA processa
        if (msg.text && msg.text.toLowerCase().includes('gemini')) {
            try {
                // LIMPEZA: Pega o texto e remove a palavra 'gemini'
                const perguntaParaIA = msg.text.replace(/gemini/gi, '').trim();
                
                // Se não houver pergunta após a palavra gemini, ele usa um padrão
                const promptFinal = perguntaParaIA || "Olá! Como posso ajudar?";

                const result = await model.generateContent(promptFinal);
                const response = await result.response;
                const textoResposta = response.text();

                // Envia a resposta da IA de volta
                io.emit('chat message', {
                    user: "Gemini_AI",
                    text: textoResposta,
                    mode: msg.mode,
                    isGemini: true
                });
            } catch (erro) {
                console.error("Erro no Gemini:", erro);
                io.emit('chat message', {
                    user: "Sistema",
                    text: "Erro ao falar com a IA. Tente novamente!",
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
