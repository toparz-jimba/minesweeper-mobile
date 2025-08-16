class SoundManager {
    constructor() {
        this.enabled = true;
        this.audioContext = null;
        this.sounds = {};
        this.initAudioContext();
        this.createSounds();
    }
    
    initAudioContext() {
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        this.audioContext = new AudioContext();
    }
    
    createSounds() {
        // Web Audio APIを使用してプログラム的にサウンドを生成
        this.sounds = {
            reveal: () => this.playTone(440, 0.05, 'sine', 0.3),
            flag: () => this.playTone(660, 0.1, 'triangle', 0.2),
            unflag: () => this.playTone(330, 0.08, 'triangle', 0.2),
            click: () => this.playClick(),
            explode: () => this.playExplosion(),
            win: () => this.playWinSound(),
            hover: () => this.playTone(880, 0.02, 'sine', 0.1),
            chain: (index) => this.playChainSound(index),
            error: () => this.playErrorSound()
        };
    }
    
    playTone(frequency, duration, type = 'sine', volume = 0.3) {
        if (!this.enabled) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.value = frequency;
            oscillator.type = type;
            
            gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
        } catch (e) {
            console.log('Audio playback failed:', e);
        }
    }
    
    playClick() {
        if (!this.enabled) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 0.05);
            oscillator.type = 'square';
            
            gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.05);
        } catch (e) {
            console.log('Audio playback failed:', e);
        }
    }
    
    playExplosion() {
        if (!this.enabled) return;
        
        try {
            const duration = 0.5;
            const noiseBuffer = this.audioContext.createBuffer(1, duration * this.audioContext.sampleRate, this.audioContext.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            
            for (let i = 0; i < noiseBuffer.length; i++) {
                output[i] = Math.random() * 2 - 1;
            }
            
            const noise = this.audioContext.createBufferSource();
            noise.buffer = noiseBuffer;
            
            const filter = this.audioContext.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(1000, this.audioContext.currentTime);
            filter.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + duration);
            
            const gainNode = this.audioContext.createGain();
            gainNode.gain.setValueAtTime(0.5, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
            
            noise.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            noise.start();
        } catch (e) {
            console.log('Audio playback failed:', e);
        }
    }
    
    playWinSound() {
        if (!this.enabled) return;
        
        try {
            const notes = [523.25, 659.25, 783.99, 1046.50]; // C, E, G, C (高)
            notes.forEach((freq, index) => {
                setTimeout(() => {
                    this.playTone(freq, 0.3, 'sine', 0.2);
                }, index * 100);
            });
        } catch (e) {
            console.log('Audio playback failed:', e);
        }
    }
    
    playChainSound(index) {
        if (!this.enabled) return;
        
        const baseFreq = 440;
        const freq = baseFreq * Math.pow(1.059463, Math.min(index, 12)); // 半音ずつ上昇
        this.playTone(freq, 0.1, 'sine', 0.15);
    }
    
    playErrorSound() {
        if (!this.enabled) return;
        
        try {
            this.playTone(200, 0.2, 'sawtooth', 0.3);
            setTimeout(() => {
                this.playTone(150, 0.2, 'sawtooth', 0.3);
            }, 100);
        } catch (e) {
            console.log('Audio playback failed:', e);
        }
    }
    
    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }
}

// グローバルインスタンス
const soundManager = new SoundManager();