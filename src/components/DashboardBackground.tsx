import { useEffect, useRef } from 'react';

export default function DashboardBackground() {
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
        };
        resize();
        window.addEventListener('resize', resize);

        // ── Neural nodes ──
        interface Node {
            x: number; y: number;
            vx: number; vy: number;
            r: number;
            pulse: number;
            pulseSpeed: number;
            color: string;
        }

        const COLORS = [
            'rgba(0,210,190,',   // teal
            'rgba(79,139,255,',  // blue
            'rgba(140,80,255,',  // purple
        ];

        const spawnNode = (): Node => ({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4,
            r: 2 + Math.random() * 3.5,
            pulse: Math.random() * Math.PI * 2,
            pulseSpeed: 0.02 + Math.random() * 0.03,
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
        });

        const nodes: Node[] = Array.from({ length: 80 }, spawnNode);

        // ── Data pulses travelling along edges ──
        interface Pulse {
            from: number; to: number;
            t: number;       // 0..1 travel progress
            speed: number;
            color: string;
        }
        const pulses: Pulse[] = [];
        const MAX_PULSES = 25;
        const MAX_DIST = 180;

        const spawnPulse = () => {
            // pick a random edge that exists
            const i = Math.floor(Math.random() * nodes.length);
            const j = Math.floor(Math.random() * nodes.length);
            if (i === j) return;
            const dx = nodes[i].x - nodes[j].x;
            const dy = nodes[i].y - nodes[j].y;
            if (Math.hypot(dx, dy) > MAX_DIST) return;
            pulses.push({
                from: i, to: j, t: 0,
                speed: 0.005 + Math.random() * 0.008,
                color: nodes[i].color,
            });
        };

        const draw = () => {
            frame++;
            const W = canvas.width;
            const H = canvas.height;

            // Dark deep-space sweep
            ctx.fillStyle = 'rgba(2, 5, 16, 0.18)';
            ctx.fillRect(0, 0, W, H);

            // ── Move nodes ──
            for (const nd of nodes) {
                nd.x += nd.vx;
                nd.y += nd.vy;
                nd.pulse += nd.pulseSpeed;
                if (nd.x < 0 || nd.x > W) nd.vx *= -1;
                if (nd.y < 0 || nd.y > H) nd.vy *= -1;
            }

            // ── Draw connections ──
            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    const dx = nodes[i].x - nodes[j].x;
                    const dy = nodes[i].y - nodes[j].y;
                    const dist = Math.hypot(dx, dy);
                    if (dist > MAX_DIST) continue;
                    const alpha = (1 - dist / MAX_DIST) * 0.25;
                    ctx.strokeStyle = `rgba(79,139,255,${alpha})`;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(nodes[i].x, nodes[i].y);
                    ctx.lineTo(nodes[j].x, nodes[j].y);
                    ctx.stroke();
                }
            }

            // ── Spawn pulses ──
            if (pulses.length < MAX_PULSES && frame % 12 === 0) spawnPulse();

            // ── Draw & advance pulses ──
            for (let p = pulses.length - 1; p >= 0; p--) {
                const pulse = pulses[p];
                pulse.t += pulse.speed;
                if (pulse.t >= 1) { pulses.splice(p, 1); continue; }

                const from = nodes[pulse.from];
                const to = nodes[pulse.to];
                const px = from.x + (to.x - from.x) * pulse.t;
                const py = from.y + (to.y - from.y) * pulse.t;

                // Bright pulse head
                const g = ctx.createRadialGradient(px, py, 0, px, py, 8);
                g.addColorStop(0, pulse.color + '1)');
                g.addColorStop(1, pulse.color + '0)');
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.arc(px, py, 8, 0, Math.PI * 2);
                ctx.fill();
            }

            // ── Draw nodes ──
            for (const nd of nodes) {
                const brightness = 0.6 + 0.4 * Math.sin(nd.pulse);
                const r = nd.r * (0.9 + 0.1 * Math.sin(nd.pulse));

                // Outer glow
                const glow = ctx.createRadialGradient(nd.x, nd.y, 0, nd.x, nd.y, r * 4);
                glow.addColorStop(0, nd.color + (brightness * 0.4).toFixed(2) + ')');
                glow.addColorStop(1, nd.color + '0)');
                ctx.fillStyle = glow;
                ctx.beginPath();
                ctx.arc(nd.x, nd.y, r * 4, 0, Math.PI * 2);
                ctx.fill();

                // Node core
                ctx.fillStyle = nd.color + brightness.toFixed(2) + ')';
                ctx.beginPath();
                ctx.arc(nd.x, nd.y, r, 0, Math.PI * 2);
                ctx.fill();
            }

            // ── Subtle vignette to keep edges dark ──
            const vignette = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.85);
            vignette.addColorStop(0, 'rgba(0,0,0,0)');
            vignette.addColorStop(1, 'rgba(2,5,16,0.55)');
            ctx.fillStyle = vignette;
            ctx.fillRect(0, 0, W, H);

            animId = requestAnimationFrame(draw);
        };

        // Solid initial fill
        ctx.fillStyle = '#020510';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        draw();

        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener('resize', resize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                inset: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 0,
            }}
        />
    );
}
