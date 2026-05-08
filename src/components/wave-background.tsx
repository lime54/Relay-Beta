"use client";

import { useEffect, useRef } from "react";

// ---------------------------------------------------------------------------
// Config – each line gets its own amplitude, frequency, phase & speed offsets
// so the motion feels organic rather than uniform.
// ---------------------------------------------------------------------------

interface WaveLine {
    amplitude: number;   // px – vertical size of the wave
    frequency: number;   // how many full waves fit across the width
    phase: number;       // starting phase offset (radians)
    speed: number;       // radians-per-second
    yOffset: number;     // vertical centre as a fraction of height (0-1)
    opacity: number;     // stroke opacity
    width: number;       // stroke width
}

const LINES: WaveLine[] = [
    { amplitude: 18, frequency: 1.2, phase: 0,     speed: 0.25, yOffset: 0.22, opacity: 0.12, width: 1.5 },
    { amplitude: 24, frequency: 0.9, phase: 1.2,   speed: 0.18, yOffset: 0.35, opacity: 0.10, width: 1.2 },
    { amplitude: 14, frequency: 1.6, phase: 2.8,   speed: 0.30, yOffset: 0.48, opacity: 0.08, width: 1.0 },
    { amplitude: 30, frequency: 0.7, phase: 0.6,   speed: 0.15, yOffset: 0.60, opacity: 0.11, width: 1.4 },
    { amplitude: 20, frequency: 1.1, phase: 4.0,   speed: 0.22, yOffset: 0.74, opacity: 0.09, width: 1.1 },
    { amplitude: 12, frequency: 1.8, phase: 3.2,   speed: 0.28, yOffset: 0.86, opacity: 0.07, width: 0.9 },
];

// Number of cubic-bezier segments per line (more = smoother)
const SEGMENTS = 48;

// ---------------------------------------------------------------------------
// Build a smooth SVG path-d string for a single wave at time `t`
// ---------------------------------------------------------------------------

function buildPath(
    w: number,
    h: number,
    line: WaveLine,
    t: number,
): string {
    const { amplitude, frequency, phase, speed, yOffset } = line;
    const cy = h * yOffset;

    // Sample points along the wave
    const points: { x: number; y: number }[] = [];
    for (let i = 0; i <= SEGMENTS; i++) {
        const frac = i / SEGMENTS;
        const x = frac * w;
        const angle = frac * frequency * Math.PI * 2 + phase + t * speed;
        const y = cy + Math.sin(angle) * amplitude;
        points.push({ x, y });
    }

    // Build a smooth cubic bezier through the sampled points using Catmull-Rom
    let d = `M${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;

    for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[Math.max(i - 1, 0)];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[Math.min(i + 2, points.length - 1)];

        // Catmull-Rom to cubic bezier control points
        const tension = 6; // higher = tighter fit
        const cp1x = p1.x + (p2.x - p0.x) / tension;
        const cp1y = p1.y + (p2.y - p0.y) / tension;
        const cp2x = p2.x - (p3.x - p1.x) / tension;
        const cp2y = p2.y - (p3.y - p1.y) / tension;

        d += ` C${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
    }

    return d;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function WaveBackground({ className }: { className?: string }) {
    const svgRef = useRef<SVGSVGElement>(null);
    const pathRefs = useRef<(SVGPathElement | null)[]>([]);
    const rafRef = useRef<number>(0);

    useEffect(() => {
        const svg = svgRef.current;
        if (!svg) return;

        let t = 0;
        let last = performance.now();

        const tick = (now: number) => {
            const dt = (now - last) / 1000; // seconds
            last = now;
            t += dt;

            const rect = svg.getBoundingClientRect();
            const w = rect.width || 800;
            const h = rect.height || 200;

            LINES.forEach((line, i) => {
                const path = pathRefs.current[i];
                if (path) {
                    path.setAttribute("d", buildPath(w, h, line, t));
                }
            });

            rafRef.current = requestAnimationFrame(tick);
        };

        rafRef.current = requestAnimationFrame(tick);

        return () => cancelAnimationFrame(rafRef.current);
    }, []);

    return (
        <svg
            ref={svgRef}
            className={className}
            preserveAspectRatio="none"
            aria-hidden="true"
            style={{ width: "100%", height: "100%" }}
        >
            {LINES.map((line, i) => (
                <path
                    key={i}
                    ref={(el) => { pathRefs.current[i] = el; }}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={line.width}
                    opacity={line.opacity}
                    strokeLinecap="round"
                />
            ))}
        </svg>
    );
}
