// Eldritch TCG - Simplified Audio Manager
// Handles all game audio including ambient loops and SFX

class EldritchAudio {
    constructor() {
        this.sounds = {};
        this.masterVolume = 0.7;
        this.sfxVolume = 0.8;
        this.ambientVolume = 0.4;
        this.isInitialized = false;
        this.ambientAudio = null;
        
        // Create audio elements immediately
        this.createAudioElements();
    }

    // Create HTML5 audio elements for all sounds
    createAudioElements() {
        console.log('🎵 Creating audio elements...');
        
        const soundFiles = {
            'cardplay': 'assets/sounds/cardplay.mp3',
            'carddraw': 'assets/sounds/carddraw.mp3', 
            'cardhit': 'assets/sounds/cardhit.mp3',
            'carddeath': 'assets/sounds/carddeath.mp3',
            'victory': 'assets/sounds/victory.mp3',
            'defeat': 'assets/sounds/defeat.mp3'
        };

        // Create SFX audio elements
        for (const [name, path] of Object.entries(soundFiles)) {
            const audio = new Audio(path);
            audio.preload = 'auto';
            audio.volume = this.sfxVolume * this.masterVolume;
            this.sounds[name] = audio;
            
            audio.addEventListener('canplaythrough', () => {
                console.log(`✅ Loaded: ${name}`);
            });
            
            audio.addEventListener('error', (e) => {
                console.error(`❌ Failed to load ${name}:`, e);
            });
        }

        // Create ambient audio
        this.ambientAudio = new Audio('assets/sounds/TheReliquary.mp3');
        this.ambientAudio.loop = true;
        this.ambientAudio.preload = 'auto';  
        this.ambientAudio.volume = this.ambientVolume * this.masterVolume;
        
        this.ambientAudio.addEventListener('canplaythrough', () => {
            console.log('✅ Loaded: TheReliquary (ambient)');
        });
        
        this.ambientAudio.addEventListener('error', (e) => {
            console.error('❌ Failed to load ambient:', e);
        });

        this.isInitialized = true;
        console.log('✅ Audio system ready');
    }

    // Start ambient music (called after user interaction)
    startAmbientMusic() {
        if (!this.ambientAudio) return;
        
        try {
            this.ambientAudio.currentTime = 0;
            const playPromise = this.ambientAudio.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    console.log('🌌 Ambient music started');
                }).catch(error => {
                    console.warn('Could not start ambient music:', error);
                });
            }
        } catch (error) {
            console.error('Error starting ambient music:', error);
        }
    }

    // Play a sound effect
    playSound(soundName, volume = 1.0) {
        console.log(`🔊 Playing: ${soundName}`);
        
        const sound = this.sounds[soundName];
        if (!sound) {
            console.warn(`❌ Sound '${soundName}' not found`);
            return;
        }

        try {
            // Reset and play the sound
            sound.currentTime = 0;
            sound.volume = (this.sfxVolume * this.masterVolume * volume);
            
            const playPromise = sound.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    console.log(`✅ Playing: ${soundName}`);
                }).catch(error => {
                    console.warn(`Could not play ${soundName}:`, error);
                });
            }
        } catch (error) {
            console.error(`Error playing ${soundName}:`, error);
        }
    }

    // Stop ambient music
    stopAmbientMusic() {
        if (this.ambientAudio && !this.ambientAudio.paused) {
            this.ambientAudio.pause();
            this.ambientAudio.currentTime = 0;
            console.log('🔇 Stopped ambient music');
        }
    }

    // Toggle ambient music
    toggleAmbientMusic() {
        if (this.ambientAudio.paused) {
            this.startAmbientMusic();
        } else {
            this.stopAmbientMusic();
        }
    }

    // Set master volume (0.0 to 1.0)
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        this.updateAllVolumes();
        console.log(`🔊 Master volume: ${(this.masterVolume * 100).toFixed(0)}%`);
    }

    // Set SFX volume (0.0 to 1.0)
    setSFXVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        this.updateAllVolumes();
        console.log(`🎯 SFX volume: ${(this.sfxVolume * 100).toFixed(0)}%`);
    }

    // Set ambient volume (0.0 to 1.0)  
    setAmbientVolume(volume) {
        this.ambientVolume = Math.max(0, Math.min(1, volume));
        this.updateAllVolumes();
        console.log(`🌌 Ambient volume: ${(this.ambientVolume * 100).toFixed(0)}%`);
    }

    // Update all audio volumes
    updateAllVolumes() {
        // Update SFX volumes
        Object.values(this.sounds).forEach(sound => {
            sound.volume = this.sfxVolume * this.masterVolume;
        });

        // Update ambient volume
        if (this.ambientAudio) {
            this.ambientAudio.volume = this.ambientVolume * this.masterVolume;
        }
    }

    // Test audio system
    testAudio() {
        console.log('🧪 Testing audio system...');
        console.log('🧪 Available sounds:', Object.keys(this.sounds));
        console.log('🧪 Ambient audio ready:', !!this.ambientAudio);
        
        console.log('🧪 Testing cardplay sound...');
        this.playSound('cardplay');
        
        setTimeout(() => {
            console.log('🧪 Testing cardhit sound...');
            this.playSound('cardhit');
        }, 1000);
    }

    // Game-specific sound methods
    playCardPlay() {
        console.log('🎵 Card play sound triggered');
        this.playSound('cardplay');
    }

    playCardDraw() {
        console.log('🎵 Card draw sound triggered');
        this.playSound('carddraw');
    }

    playCardHit() {
        console.log('🎵 Card hit sound triggered');
        this.playSound('cardhit');
    }

    playCardDeath() {
        console.log('🎵 Card death sound triggered');
        this.playSound('carddeath');
    }

    playVictory() {
        console.log('🎵 Victory sound triggered');
        this.playSound('victory');
    }

    playDefeat() {
        console.log('🎵 Defeat sound triggered');
        this.playSound('defeat');
    }

    // Initialize audio on user interaction (required by browsers)
    initializeOnUserInteraction() {
        console.log('🎵 User interaction detected, starting ambient music...');
        this.startAmbientMusic();
    }
}

// Global audio instance
let eldritchAudio = new EldritchAudio();

// Export for use in other modules
window.eldritchAudio = eldritchAudio;

// Expose test function globally for debugging
window.testAudio = () => eldritchAudio.testAudio();

// Auto-initialize on first user interaction
document.addEventListener('click', () => {
    console.log('🎵 Click detected, starting audio...');
    eldritchAudio.initializeOnUserInteraction();
}, { once: true });

document.addEventListener('keydown', () => {
    console.log('🎵 Keydown detected, starting audio...');
    eldritchAudio.initializeOnUserInteraction();
}, { once: true });

// Add test button functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Simple audio test
    const simpleTestBtn = document.getElementById('simple-audio-test');
    if (simpleTestBtn) {
        simpleTestBtn.addEventListener('click', () => {
            console.log('🧪 Simple audio test clicked');
            const testAudio = document.getElementById('test-audio');
            if (testAudio) {
                testAudio.volume = 0.5;
                testAudio.play().then(() => {
                    console.log('✅ Simple audio test SUCCESS');
                }).catch(error => {
                    console.error('❌ Simple audio test FAILED:', error);
                });
            } else {
                console.error('❌ Test audio element not found');
            }
        });
    }
    
    // Full audio system test
    const testBtn = document.getElementById('audio-test-btn');
    if (testBtn) {
        testBtn.addEventListener('click', () => {
            console.log('🧪 Full audio test button clicked');
            eldritchAudio.initializeOnUserInteraction();
            eldritchAudio.testAudio();
        });
    }
});

console.log('🎵 Eldritch Audio Manager loaded');
