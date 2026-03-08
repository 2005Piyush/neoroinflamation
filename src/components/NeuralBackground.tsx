import { useEffect, useRef } from 'react';
import brainImgUrl from '../assets/brain-hologram.png';

export default function NeuralBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animId: number;
        let frame = 0;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
        };
        resize();
        window.addEventListener('resize', resize);

        /* ── Dotted Waves (resembling the reference image) ── */
        interface Wave {
            baseY: number;
            amp: number;
            freq: number;
            phase: number;
            speed: number;
            color: string;
            dots: boolean;
            thick: boolean;
        }
        const waves: Wave[] = [];
        const baseYs = [-35, -20, -5, 10, 25, 40];
        for (const wy of baseYs) {
            // Main dotted wave
            waves.push({
                baseY: wy,
                amp: 6 + Math.random() * 8,
                freq: 0.02 + Math.random() * 0.015,
                phase: Math.random() * Math.PI * 2,
                speed: 0.01 + Math.random() * 0.015,
                color: 'rgba(200,240,255,0.7)',
                dots: true,
                thick: false
            });
            // Secondary faint continuous wave
            waves.push({
                baseY: wy + (Math.random() - 0.5) * 10,
                amp: 3 + Math.random() * 5,
                freq: 0.025 + Math.random() * 0.02,
                phase: Math.random() * Math.PI * 2,
                speed: 0.015 + Math.random() * 0.02,
                color: 'rgba(0,210,255,0.3)',
                dots: false,
                thick: Math.random() > 0.5
            });
        }

        /* ── Horizontal Light Streaks (background blur effect) ── */
        const streaks = Array.from({ length: 15 }, () => ({
            y: Math.random() * window.innerHeight,
            x: Math.random() * window.innerWidth,
            length: 100 + Math.random() * 400,
            speed: 5 + Math.random() * 15,
            alpha: 0.1 + Math.random() * 0.4
        }));

        /* ── Floating Particles (dust) ── */
        const dust = Array.from({ length: 40 }, () => ({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            size: 0.5 + Math.random() * 1.5,
            speed: 0.2 + Math.random() * 0.5,
            alpha: 0.2 + Math.random() * 0.6
        }));

        /* ── Annotations (squares with diamonds and straight lines) ── */
        const markers = [
            [-60, -50, -120, -30], [-40, -70, -80, -90], [-10, -80, -20, -120],
            [30, -70, 80, -90], [50, -40, 110, -50], [60, 10, 120, 20],
            [30, 50, 80, 80], [-20, 60, -40, 100], [-50, 30, -100, 40],
            [0, 0, -80, -10], [10, -20, 70, -30], [-20, -20, -50, -50]
        ].map(([dx, dy, tx, ty]) => ({
            dx, dy, tx, ty, pulse: Math.random() * Math.PI * 2
        }));

        const draw = () => {
            frame++;
            const W = canvas.width;
            const H = canvas.height;

            // Start clean: Deep space dark background layer is in a div behind us now.
            ctx.clearRect(0, 0, W, H);

            const cx = W * 0.5;
            const cy = H * 0.5;
            const s = Math.min(W, H) * 0.0035;

            /* ── Streaks (Background Layer beneath the brain) ── */
            for (const st of streaks) {
                st.x += st.speed;
                if (st.x > W + st.length) {
                    st.x = -st.length;
                    st.y = Math.random() * H;
                }
                const grad = ctx.createLinearGradient(st.x, st.y, st.x + st.length, st.y);
                grad.addColorStop(0, 'rgba(0,180,255,0)');
                grad.addColorStop(0.5, `rgba(180,230,255,${st.alpha})`);
                grad.addColorStop(1, 'rgba(0,180,255,0)');
                ctx.beginPath();
                ctx.moveTo(st.x, st.y);
                ctx.lineTo(st.x + st.length, st.y);
                ctx.strokeStyle = grad;
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }

            /* ── Inner network lines around brain ── */
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.strokeStyle = 'rgba(0,180,255,0.1)';
            ctx.lineWidth = 1;
            for (let i = 0; i < 40; i++) {
                ctx.beginPath();
                const x1 = cx + (Math.random() - 0.5) * 200 * s;
                const y1 = cy + (Math.random() - 0.5) * 200 * s;
                const x2 = x1 + (Math.random() - 0.5) * 50 * s;
                const y2 = y1 + (Math.random() - 0.5) * 50 * s;
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            }
            ctx.restore();

            /* ── Sinusoidal Waves (Middle layer passing through image) ── */
            for (const w of waves) {
                w.phase += w.speed;
                const baseY = cy + w.baseY * s;

                if (w.dots) {
                    ctx.fillStyle = w.color;
                    for (let px = 0; px <= W; px += 8) {
                        const wx = (px - cx) / s;
                        const wy = w.baseY + w.amp * Math.sin(w.freq * wx + w.phase);
                        ctx.beginPath();
                        ctx.arc(px, cy + wy * s, 1.2, 0, Math.PI * 2);
                        ctx.fill();
                    }
                } else {
                    ctx.beginPath();
                    ctx.moveTo(0, baseY + w.amp * s * Math.sin(w.phase));
                    for (let px = 1; px <= W; px += 4) {
                        const wx = (px - cx) / s;
                        const wy = w.baseY + w.amp * Math.sin(w.freq * wx + w.phase);
                        ctx.lineTo(px, cy + wy * s);
                    }
                    ctx.strokeStyle = w.color;
                    ctx.lineWidth = w.thick ? 2 : 1;
                    ctx.stroke();
                }
            }

            /* ── ANNOTATION MARKERS (Overlaying the brain image) ── */
            for (const m of markers) {
                m.pulse += 0.05;
                const px = cx + m.dx * s;
                const py = cy + m.dy * s;
                const tx = cx + m.tx * s;
                const ty = cy + m.ty * s;
                const a = 0.6 + 0.4 * Math.sin(m.pulse);

                // Line connecting dot to target
                ctx.strokeStyle = `rgba(180,230,255,${a * 0.7})`;
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.moveTo(px, py);
                ctx.lineTo(tx, ty);
                ctx.stroke();

                // Target box (Square with diamond)
                ctx.strokeStyle = `rgba(255,255,255,${a})`;
                ctx.lineWidth = 1.5;
                const b = 6; // Box size
                ctx.strokeRect(tx - b, ty - b, b * 2, b * 2);

                // Inner diamond
                ctx.fillStyle = `rgba(255,255,255,${a})`;
                ctx.beginPath();
                ctx.moveTo(tx, ty - b + 2);
                ctx.lineTo(tx + b - 2, ty);
                ctx.lineTo(tx, ty + b - 2);
                ctx.lineTo(tx - b + 2, ty);
                ctx.closePath();
                ctx.fill();

                // Origin dot
                ctx.beginPath();
                ctx.arc(px, py, 2.5, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255,255,255,0.9)';
                ctx.fill();
            }

            /* ── Dust (Topmost Layer) ── */
            for (const d of dust) {
                d.x -= d.speed;
                if (d.x < 0) d.x = W;
                ctx.fillStyle = `rgba(200,240,255,${d.alpha * (0.5 + 0.5 * Math.sin(frame * 0.05))})`;
                ctx.beginPath();
                ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
                ctx.fill();
            }

            animId = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener('resize', resize);
        };
    }, []);

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 0,
            backgroundColor: '#010308',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden'
        }}>
            {/* The core 3D brain image rendered directly to DOM to guarantee flawless loading & visibility */}
            <img
                src={brainImgUrl}
                alt="Neural Hologram Brain"
                style={{
                    position: 'absolute',
                    width: 'auto',
                    height: '100%',
                    maxWidth: '100%',
                    objectFit: 'contain',
                    mixBlendMode: 'screen', /* Drops black bg, blends cyan glow */
                    opacity: 1,
                    pointerEvents: 'none',
                }}
            />
            {/* The particle system canvas rendering over the image */}
            <canvas
                ref={canvasRef}
                style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none',
                }}
            />
        </div>
    );
}
