import React, { useRef, useState, useEffect } from 'react';

interface FormViewerModalProps {
    form: { id: string; form_code: string };
    entityId: string;
    onClose: () => void;
    onSuccess: () => void;
}

const FormViewerModal: React.FC<FormViewerModalProps> = ({ form, entityId, onClose, onSuccess }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Signature Pad Logic
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
    }, []);

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDrawing(true);
        draw(e);
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx?.beginPath();
        }
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        const rect = canvas.getBoundingClientRect();
        let clientX, clientY;

        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }

        const x = clientX - rect.left;
        const y = clientY - rect.top;

        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (canvas && ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    };

    const handleSubmit = async () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const signatureData = canvas.toDataURL('image/png');
        
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/v1/forms/sign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ formId: form.id, signatureData })
            });
            const data = await res.json();
            if (data.success) {
                onSuccess();
            }
        } catch (err) {
            console.error('Signing failed:', err);
        }
        setIsSubmitting(false);
    };

    return (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div className="modal-content" style={{ background: '#fff', width: '90%', maxWidth: '600px', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ padding: '20px', background: 'var(--primary)', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0 }}>Digital Signature // {form.form_code}</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.2rem' }}>&times;</button>
                </div>

                <div style={{ padding: '30px' }}>
                    <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '6px', marginBottom: '20px', fontSize: '0.8rem', borderLeft: '4px solid var(--primary)' }}>
                        <strong>IRIS PROGRAM COMPLIANCE NOTICE:</strong> By signing below, you verify that all provided data for form {form.form_code} is accurate and complete under penalty of state and federal Medicaid compliance law.
                    </div>

                    <div style={{ border: '1px dashed #ccc', marginBottom: '10px' }}>
                        <canvas 
                            ref={canvasRef}
                            width={540}
                            height={200}
                            onMouseDown={startDrawing}
                            onMouseUp={stopDrawing}
                            onMouseMove={draw}
                            onTouchStart={startDrawing}
                            onTouchEnd={stopDrawing}
                            onTouchMove={draw}
                            style={{ cursor: 'crosshair', display: 'block' }}
                        />
                    </div>
                    <div style={{ textAlign: 'center', color: '#888', fontSize: '0.7rem', marginBottom: '20px' }}>
                        PLACE_PARTICIPANT_OR_AUTHORIZED_SIGNATURE_ABOVE
                    </div>

                    <div style={{ display: 'flex', gap: '15px' }}>
                        <button onClick={clearCanvas} style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid #ccc', cursor: 'pointer' }}>CLEAR</button>
                        <button 
                            disabled={isSubmitting}
                            onClick={handleSubmit} 
                            style={{ flex: 2, padding: '12px', background: 'var(--primary)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700 }}
                        >
                            {isSubmitting ? 'PROCESSING...' : 'CONFIRM_AND_SAVE_SIGNATURE'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FormViewerModal;
