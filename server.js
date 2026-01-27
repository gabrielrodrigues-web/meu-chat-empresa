const express = require('express');
const app = express();
const http = require('http').createServer(app);

// Permite fotos e áudios de até 10MB
const io = require('socket.io')(http, { 
    maxHttpBufferSize: 1e7 
});

const { GoogleGenerativeAI } = require("@google/generative-ai");

// Sua chave de API
const MINHA_CHAVE = 'AIzaSyC55FiH5DEr8caVLPwc2Zxpfv_F1isQBEI'; 
const genAI = new GoogleGenerativeAI(MINHA_CHAVE);

// Usando o modelo padrão estável
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
    socket.on('chat message', async (msg) => {
        // Envia sua mensagem para o chat aparecer na tela
        io.emit('chat message', msg);

        // Verifica se você marcou a IA
        if (msg.text && msg.text.toLowerCase().includes('gemini')) {
            try {
                // CORREÇÃO AQUI: Remove a palavra 'gemini' e pega o resto da sua pergunta
                const perguntaPura = msg.text.replace(/gemini/gi, '').trim();
                
                // Se você não escreveu nada depois de 'gemini', ele pergunta o que você quer
                const textoParaEnviar = perguntaPura || "Olá! Como posso te ajudar hoje?";

                const result = await model.generateContent(textoParaEnviar);
                const response = await result.response;
                
                io.emit('chat message', {
                    user: "Gemini_AI",
                    text: response.text(),
                    mode: msg.mode,
                    isGemini: true
                });
            } catch (erro) {
                console.error("Erro no Gemini:", erro);
                io.emit('chat message', {
                    user: "Sistema",
                    text: "Tive um erro ao processar sua pergunta. Tente novamente!",
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
