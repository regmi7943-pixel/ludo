import { useCallback, useRef } from 'react';

// Simple Web Audio API sound effects
// No external files needed - generates sounds programmatically

export function useSounds() {
    const audioContextRef = useRef<AudioContext | null>(null);

    const getAudioContext = useCallback(() => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        return audioContextRef.current;
    }, []);

    // Dice roll sound - rapid clicking noise
    const playDiceRoll = useCallback(() => {
        const ctx = getAudioContext();
        const now = ctx.currentTime;

        for (let i = 0; i < 8; i++) {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.frequency.value = 200 + Math.random() * 400;
            osc.type = 'square';

            const startTime = now + i * 0.05;
            gain.gain.setValueAtTime(0.1, startTime);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.04);

            osc.start(startTime);
            osc.stop(startTime + 0.05);
        }
    }, [getAudioContext]);

    // Token move sound - soft pop
    const playMove = useCallback(() => {
        const ctx = getAudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1);
        osc.type = 'sine';

        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

        osc.start();
        osc.stop(ctx.currentTime + 0.15);
    }, [getAudioContext]);

    // Capture sound - dramatic hit
    const playCapture = useCallback(() => {
        const ctx = getAudioContext();

        // Low thud
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.frequency.setValueAtTime(150, ctx.currentTime);
        osc1.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.2);
        osc1.type = 'sine';
        gain1.gain.setValueAtTime(0.3, ctx.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc1.start();
        osc1.stop(ctx.currentTime + 0.3);

        // High ping
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.frequency.setValueAtTime(1200, ctx.currentTime);
        osc2.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);
        osc2.type = 'triangle';
        gain2.gain.setValueAtTime(0.15, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc2.start();
        osc2.stop(ctx.currentTime + 0.2);
    }, [getAudioContext]);

    // Win/finish sound - triumphant chord
    const playWin = useCallback(() => {
        const ctx = getAudioContext();
        const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5 major chord

        frequencies.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.frequency.value = freq;
            osc.type = 'sine';

            const startTime = ctx.currentTime + i * 0.1;
            gain.gain.setValueAtTime(0.15, startTime);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.5);

            osc.start(startTime);
            osc.stop(startTime + 0.5);
        });
    }, [getAudioContext]);

    return { playDiceRoll, playMove, playCapture, playWin };
}
