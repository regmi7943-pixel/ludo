import React, { useEffect, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';

interface DiceProps {
    value: number | null;
    rolling: boolean;
    onClick: () => void;
    disabled: boolean;
}

export const Dice: React.FC<DiceProps> = ({ value, rolling, onClick, disabled }) => {
    const controls = useAnimation();
    const [displayValue, setDisplayValue] = useState(1);

    useEffect(() => {
        if (value) {
            setDisplayValue(value);
        }
    }, [value]);

    useEffect(() => {
        if (rolling) {
            controls.start({
                rotateX: [0, 360, 720, 1080],
                rotateY: [0, 360, 720, 1080],
                transition: { duration: 0.5, ease: "linear", repeat: Infinity }
            });
        } else {
            // Stop at precise angles for the target value
            const rotations: Record<number, { x: number, y: number }> = {
                1: { x: 0, y: 0 },
                2: { x: -90, y: 0 },
                3: { x: 0, y: -90 },
                4: { x: 0, y: 90 },
                5: { x: 90, y: 0 },
                6: { x: 180, y: 0 }
            };

            const target = rotations[displayValue] || { x: 0, y: 0 };

            // Add extra spins for effect then land
            controls.start({
                rotateX: target.x + 720, // Add 2 full spins to ensure movement
                rotateY: target.y + 720,
                transition: { duration: 0.5, type: "spring", damping: 15 }
            });
        }
    }, [rolling, displayValue, controls]);

    return (
        <div className="relative w-16 h-16 [perspective:1000px] z-50">
            <motion.div
                className={`w-full h-full relative [transform-style:preserve-3d] cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'}`}
                animate={controls}
                onClick={!disabled ? onClick : undefined}
                whileTap={!disabled ? { scale: 0.9 } : undefined}
                initial={{ rotateX: 0, rotateY: 0 }}
            >
                {/* Face 1 */}
                <div className="absolute w-full h-full bg-white border-2 border-slate-300 rounded-xl flex items-center justify-center [backface-visibility:hidden] shadow-inner inset-0 [transform:translateZ(32px)]">
                    <div className="w-3 h-3 bg-black rounded-full" />
                </div>

                {/* Face 2 */}
                <div className="absolute w-full h-full bg-white border-2 border-slate-300 rounded-xl flex items-center justify-between p-3 [backface-visibility:hidden] shadow-inner inset-0 [transform:rotateX(90deg)translateZ(32px)]">
                    <div className="w-3 h-3 bg-black rounded-full" />
                    <div className="w-3 h-3 bg-black rounded-full self-end" />
                </div>

                {/* Face 3 */}
                <div className="absolute w-full h-full bg-white border-2 border-slate-300 rounded-xl flex items-center justify-center [backface-visibility:hidden] shadow-inner inset-0 [transform:rotateY(90deg)translateZ(32px)]">
                    <div className="w-3 h-3 bg-black rounded-full -translate-x-4 -translate-y-4" />
                    <div className="w-3 h-3 bg-black rounded-full" />
                    <div className="w-3 h-3 bg-black rounded-full translate-x-4 translate-y-4" />
                </div>

                {/* Face 4 */}
                <div className="absolute w-full h-full bg-white border-2 border-slate-300 rounded-xl flex flex-wrap p-3 justify-between content-between [backface-visibility:hidden] shadow-inner inset-0 [transform:rotateY(-90deg)translateZ(32px)]">
                    <div className="w-3 h-3 bg-black rounded-full" />
                    <div className="w-3 h-3 bg-black rounded-full" />
                    <div className="w-full" /> {/* Break */}
                    <div className="w-3 h-3 bg-black rounded-full" />
                    <div className="w-3 h-3 bg-black rounded-full" />
                </div>

                {/* Face 5 */}
                <div className="absolute w-full h-full bg-white border-2 border-slate-300 rounded-xl flex flex-wrap p-3 justify-center content-center gap-1 [backface-visibility:hidden] shadow-inner inset-0 [transform:rotateX(-90deg)translateZ(32px)]">
                    <div className="absolute top-3 left-3 w-3 h-3 bg-black rounded-full" />
                    <div className="absolute top-3 right-3 w-3 h-3 bg-black rounded-full" />
                    <div className="absolute w-3 h-3 bg-black rounded-full" />
                    <div className="absolute bottom-3 left-3 w-3 h-3 bg-black rounded-full" />
                    <div className="absolute bottom-3 right-3 w-3 h-3 bg-black rounded-full" />
                </div>

                {/* Face 6 */}
                <div className="absolute w-full h-full bg-white border-2 border-slate-300 rounded-xl flex flex-wrap p-3 justify-between content-between [backface-visibility:hidden] shadow-inner inset-0 [transform:rotateY(180deg)translateZ(32px)]">
                    <div className="w-3 h-3 bg-black rounded-full" />
                    <div className="w-3 h-3 bg-black rounded-full" />
                    <div className="w-full" /> {/* Break */}
                    <div className="w-3 h-3 bg-black rounded-full" />
                    <div className="w-3 h-3 bg-black rounded-full" />
                    <div className="w-full" /> {/* Break */}
                    <div className="w-3 h-3 bg-black rounded-full" />
                    <div className="w-3 h-3 bg-black rounded-full" />
                </div>

            </motion.div>
        </div>
    );
};
