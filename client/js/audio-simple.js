// Simple Audio System
console.log('Loading simple audio system...');

class SimpleAudio {
    constructor() {
        this.ambientAudio = null;
        this.sounds = {};
        this.isInitialized = false;
        console.log('SimpleAudio constructor called');
    }

    init() {
        console.log('SimpleAudio init called');
        this.createSounds();
        this.isInitialized = true;
    }

    createSounds() {
        console.log('Creating sound elements...');
        
        // Create ambient music (use TheReliquary.mp3 which was working before)
        this.ambientAudio = new Audio('assets/sounds/TheReliquary.mp3');
        this.ambientAudio.loop = true;
        this.ambientAudio.volume = 0.3;
        console.log('Ambient audio created: TheReliquary.mp3');
        
        // Create sound effects
        const soundList = ['cardplay', 'carddraw', 'cardhit', 'carddeath', 'victory', 'defeat'];
        soundList.forEach(soundName => {
            const audio = new Audio(`assets/sounds/${soundName}.mp3`);
            audio.volume = 0.6;
            
            audio.addEventListener('canplaythrough', () => {
                console.log(`✅ Loaded: ${soundName}`);
            });
            
            audio.addEventListener('error', (e) => {
                console.error(`❌ Failed to load ${soundName}:`, e);
            });
            
            this.sounds[soundName] = audio;
            console.log(`Created sound: ${soundName} -> assets/sounds/${soundName}.mp3`);
        });
        
        // Add error handling to ambient audio too
        this.ambientAudio.addEventListener('canplaythrough', () => {
            console.log('✅ Loaded: TheReliquary (ambient)');
        });
        
        this.ambientAudio.addEventListener('error', (e) => {
            console.error('❌ Failed to load ambient audio:', e);
        });
    }

    // Start ambient music
    startAmbientMusic() {
        console.log('Starting ambient music...');
        if (this.ambientAudio) {
            this.ambientAudio.play().catch(err => {
                console.error('Failed to start ambient music:', err);
            });
        }
    }

    // Toggle ambient music
    toggleAmbientMusic() {
        console.log('Toggling ambient music...');
        if (this.ambientAudio) {
            if (this.ambientAudio.paused) {
                this.startAmbientMusic();
                return false; // not muted
            } else {
                this.ambientAudio.pause();
                return true; // muted
            }
        }
        return true;
    }

    // Ensure audio is initialized
    ensureInitialized() {
        if (!this.isInitialized) {
            console.log('Auto-initializing audio...');
            this.init();
        }
    }

    // Play a sound
    playSound(soundName) {
        this.ensureInitialized();
        console.log(`🎵 Trying to play sound: ${soundName}`);
        console.log(`🎵 Available sounds:`, Object.keys(this.sounds));
        
        const sound = this.sounds[soundName];
        if (sound) {
            console.log(`🎵 Found sound ${soundName}, attempting to play...`);
            sound.currentTime = 0;
            sound.play().then(() => {
                console.log(`✅ Successfully played: ${soundName}`);
            }).catch(err => {
                console.error(`❌ Failed to play ${soundName}:`, err);
            });
        } else {
            console.error(`❌ Sound not found: ${soundName}`);
            console.error(`❌ Available sounds are:`, Object.keys(this.sounds));
        }
    }

    // Game-specific sound methods
    playCardPlay() {
        this.ensureInitialized();
        console.log('Card play sound triggered');
        this.playSound('cardplay');
        
        // Auto-start ambient music if not already playing
        if (this.ambientAudio && this.ambientAudio.paused) {
            console.log('Auto-starting ambient music...');
            this.startAmbientMusic();
        }
    }

    playCardDraw() {
        this.ensureInitialized();
        console.log('Card draw sound triggered');
        this.playSound('carddraw');
    }

    playCardHit() {
        this.ensureInitialized();
        console.log('Card hit sound triggered');
        this.playSound('cardhit');
    }

    playCardDeath() {
        this.ensureInitialized();
        console.log('Card death sound triggered');
        this.playSound('carddeath');
    }

    playVictory() {
        this.ensureInitialized();
        console.log('Victory sound triggered');
        this.playSound('victory');
    }

    playDefeat() {
        this.ensureInitialized();
        console.log('Defeat sound triggered');
        this.playSound('defeat');
    }
}

// Create global instance
window.simpleAudio = new SimpleAudio();

// Add global test function for debugging
window.testSimpleAudio = function() {
    console.log('=== AUDIO DEBUG TEST ===');
    console.log('simpleAudio exists:', !!window.simpleAudio);
    console.log('simpleAudio initialized:', window.simpleAudio?.isInitialized);
    console.log('Available sounds:', Object.keys(window.simpleAudio?.sounds || {}));
    
    if (window.simpleAudio) {
        console.log('Testing cardplay sound...');
        window.simpleAudio.playSound('cardplay');
    }
};

// Auto-start ambient music on first click
document.addEventListener('click', () => {
    console.log('First click detected, starting audio...');
    if (!window.simpleAudio.isInitialized) {
        window.simpleAudio.init();
        window.simpleAudio.startAmbientMusic();
    }
}, { once: true });

// Also try on keydown
document.addEventListener('keydown', () => {
    console.log('First keydown detected, starting audio...');
    if (!window.simpleAudio.isInitialized) {
        window.simpleAudio.init();
        window.simpleAudio.startAmbientMusic();
    }
}, { once: true });

console.log('Simple audio system loaded');
