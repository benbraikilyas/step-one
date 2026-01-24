import { useState, useEffect, useRef } from 'react';
import ReactPlayer from 'react-player';

interface BackgroundAudioProps {
    url: string;
}

export default function BackgroundAudio({ url }: BackgroundAudioProps) {
    const [playing, setPlaying] = useState(true);
    const [muted, setMuted] = useState(true);
    const [volume, setVolume] = useState(0);
    const hasInteracted = useRef(false);

    useEffect(() => {
        // Function to handle the first interaction to unlock audio
        const handleInteraction = () => {
            if (hasInteracted.current) return;
            hasInteracted.current = true;

            // Unmute and start fade in
            setMuted(false);

            // Fade in volume logic
            const fadeDuration = 1000; // Faster fade (1 second)
            const targetVolume = 0.5; // Louder target volume
            const steps = 20;
            const stepTime = fadeDuration / steps;
            const volumeStep = targetVolume / steps;

            let currentStep = 0;
            const interval = setInterval(() => {
                currentStep++;
                const newVolume = Math.min(volumeStep * currentStep, targetVolume);
                setVolume(newVolume);

                if (currentStep >= steps) {
                    clearInterval(interval);
                }
            }, stepTime);

            // Cleanup all listeners
            ['click', 'keydown', 'touchstart', 'mousemove', 'scroll'].forEach(event =>
                window.removeEventListener(event, handleInteraction)
            );
        };

        // Add listeners for ANY user interaction
        ['click', 'keydown', 'touchstart', 'mousemove', 'scroll'].forEach(event =>
            window.addEventListener(event, handleInteraction)
        );

        return () => {
            ['click', 'keydown', 'touchstart', 'mousemove', 'scroll'].forEach(event =>
                window.removeEventListener(event, handleInteraction)
            );
        };
    }, []);

    return (
        <div className="fixed bottom-0 right-0 opacity-0 pointer-events-none z-[-1]">
            <ReactPlayer
                src={url}
                playing={playing}
                loop={true}
                muted={muted}
                volume={volume}
                width="1px"
                height="1px"
                playsInline={true}
                config={{
                    youtube: {
                        playerVars: {
                            showinfo: 0,
                            controls: 0,
                            disablekb: 1,
                            autoplay: 1
                        }
                    } as any
                }}
                onError={(e) => console.warn("Audio playback error:", e)}
            />
        </div>
    );
}
