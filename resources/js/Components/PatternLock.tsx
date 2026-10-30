import { useRef, useState } from 'react';

const SIZE = 260;
const DOT_RADIUS = 10;
const HIT_RADIUS = 32;
const MIN_POINTS = 4;

const DOTS = [0, 1, 2].flatMap((row) =>
    [0, 1, 2].map((col) => ({
        x: 50 + col * 80,
        y: 50 + row * 80,
    })),
);

export default function PatternLock({
    onComplete,
    error = false,
}: {
    onComplete: (pattern: number[]) => void;
    error?: boolean;
}) {
    const svgRef = useRef<SVGSVGElement>(null);
    const [path, setPath] = useState<number[]>([]);
    const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);
    const dragging = useRef(false);

    function toSvgPoint(clientX: number, clientY: number) {
        const rect = svgRef.current!.getBoundingClientRect();
        return {
            x: ((clientX - rect.left) / rect.width) * SIZE,
            y: ((clientY - rect.top) / rect.height) * SIZE,
        };
    }

    function nearestDot(point: { x: number; y: number }) {
        let closest = -1;
        let closestDist = HIT_RADIUS;
        DOTS.forEach((dot, i) => {
            const dist = Math.hypot(dot.x - point.x, dot.y - point.y);
            if (dist < closestDist) {
                closest = i;
                closestDist = dist;
            }
        });
        return closest;
    }

    function reset() {
        dragging.current = false;
        setPath([]);
        setPointer(null);
    }

    function handlePointerDown(e: React.PointerEvent<SVGSVGElement>) {
        const point = toSvgPoint(e.clientX, e.clientY);
        const dot = nearestDot(point);
        if (dot === -1) return;
        svgRef.current?.setPointerCapture(e.pointerId);
        dragging.current = true;
        setPath([dot]);
        setPointer(point);
    }

    function handlePointerMove(e: React.PointerEvent<SVGSVGElement>) {
        if (!dragging.current) return;
        const point = toSvgPoint(e.clientX, e.clientY);
        setPointer(point);
        const dot = nearestDot(point);
        if (dot !== -1) {
            setPath((prev) => (prev.includes(dot) ? prev : [...prev, dot]));
        }
    }

    function handlePointerUp() {
        if (!dragging.current) return;
        dragging.current = false;
        if (path.length >= MIN_POINTS) {
            onComplete(path);
        }
        setPath([]);
        setPointer(null);
    }

    const lineColor = error ? '#ef4444' : '#3b82f6';

    return (
        <svg
            ref={svgRef}
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            className={`touch-none select-none ${error ? 'animate-[shake_0.3s]' : ''}`}
            style={{ width: SIZE, height: SIZE }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={reset}
        >
            {path.length > 0 && (
                <polyline
                    points={[
                        ...path.map((i) => `${DOTS[i].x},${DOTS[i].y}`),
                        ...(pointer ? [`${pointer.x},${pointer.y}`] : []),
                    ].join(' ')}
                    fill="none"
                    stroke={lineColor}
                    strokeWidth={4}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={0.6}
                />
            )}
            {DOTS.map((dot, i) => {
                const active = path.includes(i);
                return (
                    <circle
                        key={i}
                        cx={dot.x}
                        cy={dot.y}
                        r={active ? DOT_RADIUS * 1.3 : DOT_RADIUS}
                        fill={active ? lineColor : 'none'}
                        stroke={active ? lineColor : '#9ca3af'}
                        strokeWidth={2}
                        className="transition-all"
                    />
                );
            })}
        </svg>
    );
}
