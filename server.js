<div class="stage">
    <div id="ranking-box">
        <div style="font-weight:bold; margin-bottom:5px; text-align:center;">TOP 5 ELITE</div>
        <div id="ranking-list"></div>
    </div>
    ```

**No final do seu `<script>`, substitua o evento de `mousedown` e adicione o receptor do ranking:**
```javascript
// Atualize o listener de clique para avisar o servidor
canvas.addEventListener('mousedown', (e) => {
    particles.forEach((p) => {
        if(!p.exploded && e.clientX > p.x && e.clientX < p.x + 45 && e.clientY > p.y - 40 && e.clientY < p.y + 10) {
            p.exploded = true;
            placar[sala]++;
            document.getElementById('score').innerText = placar[sala];
            // NOVO: Avisa o servidor que você marcou ponto
            socket.emit('update score', { room: sala });
        }
    });
});

// NOVO: Escuta a atualização do ranking vinda do servidor
socket.on('update ranking', (ranking) => {
    const list = document.getElementById('ranking-list');
    list.innerHTML = "";
    ranking.forEach((u, i) => {
        const div = document.createElement('div');
        div.className = "rank-item";
        div.innerHTML = `<span>${i+1}. ${u.name}</span> <span>${u.score}</span>`;
        list.appendChild(div);
    });
});
