class ParticleSystem {
    constructor() {
        this.container = null;
        this.init();
    }
    
    init() {
        // パーティクル用のコンテナを作成
        this.container = document.createElement('div');
        this.container.style.position = 'fixed';
        this.container.style.top = '0';
        this.container.style.left = '0';
        this.container.style.width = '100%';
        this.container.style.height = '100%';
        this.container.style.pointerEvents = 'none';
        this.container.style.zIndex = '9999';
        document.body.appendChild(this.container);
    }
    
    createParticle(x, y, type = 'success') {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // タイプに応じてスタイルを設定
        switch(type) {
            case 'success':
                particle.style.background = 'linear-gradient(45deg, #ffd700, #ffed4e)';
                particle.style.width = '6px';
                particle.style.height = '6px';
                break;
            case 'flag':
                particle.style.background = 'linear-gradient(45deg, #ff6b6b, #ffa500)';
                particle.style.width = '4px';
                particle.style.height = '4px';
                break;
            case 'reveal':
                particle.style.background = 'linear-gradient(45deg, #4fc3f7, #81c784)';
                particle.style.width = '3px';
                particle.style.height = '3px';
                break;
            case 'explode':
                particle.style.background = 'linear-gradient(45deg, #ff0000, #ff6600)';
                particle.style.width = '8px';
                particle.style.height = '8px';
                break;
            case 'chain':
                particle.style.background = 'linear-gradient(45deg, #e91e63, #9c27b0)';
                particle.style.width = '4px';
                particle.style.height = '4px';
                break;
        }
        
        particle.style.position = 'absolute';
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        particle.style.borderRadius = '50%';
        particle.style.pointerEvents = 'none';
        
        // ランダムな方向を設定
        const angle = Math.random() * Math.PI * 2;
        const distance = 30 + Math.random() * 50;
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance - 20; // 少し上向きに
        
        particle.style.setProperty('--tx', tx + 'px');
        particle.style.setProperty('--ty', ty + 'px');
        
        this.container.appendChild(particle);
        
        // アニメーション終了後に削除
        setTimeout(() => {
            particle.remove();
        }, 800);
    }
    
    burst(x, y, type = 'success', count = 8) {
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                this.createParticle(x, y, type);
            }, i * 30);
        }
    }
    
    chainEffect(cells) {
        cells.forEach((cell, index) => {
            setTimeout(() => {
                const rect = cell.getBoundingClientRect();
                const x = rect.left + rect.width / 2;
                const y = rect.top + rect.height / 2;
                this.createParticle(x, y, 'chain');
            }, index * 50);
        });
    }
    
    flagEffect(element) {
        const rect = element.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        this.burst(x, y, 'flag', 6);
    }
    
    revealEffect(element) {
        const rect = element.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        this.burst(x, y, 'reveal', 4);
    }
    
    explodeEffect(element) {
        const rect = element.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        this.burst(x, y, 'explode', 12);
    }
    
    winCelebration() {
        const cells = document.querySelectorAll('.cell');
        const interval = setInterval(() => {
            const randomCell = cells[Math.floor(Math.random() * cells.length)];
            const rect = randomCell.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;
            this.burst(x, y, 'success', 3);
        }, 200);
        
        // 3秒後に停止
        setTimeout(() => {
            clearInterval(interval);
        }, 3000);
    }
}

// グローバルインスタンス
const particleSystem = new ParticleSystem();