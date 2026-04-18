import React, { useRef, useState } from 'react';

/**
 * IRIS OS - Digital Signature Canvas
 * Goal: Compliant capture of participant signatures for work orders.
 */
const SignatureCanvas: React.FC<{ onSave: (blob: string) => void }> = ({ onSave }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDrawing(true);
        draw(e);
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        const canvas = canvasRef.current;
        if (canvas) {
            onSave(canvas.toDataURL());
        }
    };

    const draw = (e: any) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX || e.touches?.[0].clientX) - rect.left;
        const y = (e.clientY || e.touches?.[0].clientY) - rect.top;

        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#000';

        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const clear = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx?.clearRect(0, 0, canvas.width, canvas.height);
        }
    };

    return (
        <div className="card" style={{ background: '#fff', padding: '10px', border: '1px solid #cbd5e1' }}>
            <div style={{ fontSize: '0.6rem', color: '#64748b', marginBottom: '5px' }}>PARTICIPANT_SIGNATURE_REQUIRED</div>
            <canvas
                ref={canvasRef}
                width={400}
                height={150}
                onMouseDown={startDrawing}
                onMouseUp={stopDrawing}
                onMouseMove={draw}
                onTouchStart={startDrawing}
                onTouchEnd={stopDrawing}
                style={{ border: '1px dashed #94a3b8', borderRadius: '4px', cursor: 'crosshair', background: '#fdfdfd' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                <button onClick={clear} style={{ fontSize: '0.55rem', padding: '4px 8px', background: '#f1f5f9', border: '1px solid #e2e8f0', cursor: 'pointer' }}>CLEAR</button>
                <div style={{ fontSize: '0.5rem', color: '#94a3b8', fontStyle: 'italic' }}>I certify that this is my electronic signature.</div>
            </div>
        </div>
    );
};

export default SignatureCanvas;
