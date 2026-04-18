import React, { useState } from 'react';

interface DocumentPreviewModalProps {
    documentId: string;
    filename: string;
    viewMode: 'NATIVE' | 'CUSTOM';
    onClose: () => void;
}

const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({ documentId, filename, viewMode, onClose }) => {
    const [zoom, setZoom] = useState(100);
    const viewUrl = `/api/v1/documents/view/${documentId}`;

    return (
        <div className="modal-overlay" style={{ 
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', 
            background: 'rgba(15, 23, 42, 0.9)', zIndex: 2000, 
            display: 'flex', flexDirection: 'column' 
        }}>
            {/* PREMIUM HEADER */}
            <div style={{ 
                background: '#1e293b', padding: '15px 25px', color: '#fff', 
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                borderBottom: '1px solid #334155', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
            }}>
                <div>
                    <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600, letterSpacing: '0.05em' }}>PREVIEWING_SECURE_DOCUMENT</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700 }}>{filename}</div>
                </div>

                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    {viewMode === 'CUSTOM' && (
                        <div style={{ display: 'flex', gap: '10px', background: '#334155', padding: '5px 15px', borderRadius: '20px', alignItems: 'center' }}>
                            <button onClick={() => setZoom(Math.max(50, zoom - 10))} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><i className="fas fa-search-minus"></i></button>
                            <span style={{ fontSize: '0.75rem', minWidth: '40px', textAlign: 'center' }}>{zoom}%</span>
                            <button onClick={() => setZoom(Math.min(200, zoom + 10))} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><i className="fas fa-search-plus"></i></button>
                        </div>
                    )}
                    
                    <a href={`/api/v1/documents/download/${documentId}`} target="_blank" rel="noreferrer" 
                       style={{ color: '#fff', fontSize: '0.8rem', textDecoration: 'none', background: '#3b82f6', padding: '8px 16px', borderRadius: '4px', fontWeight: 600 }}>
                       <i className="fas fa-download"></i> DOWNLOAD
                    </a>

                    <button onClick={onClose} style={{ 
                        background: '#ef4444', color: '#fff', border: 'none', 
                        width: '32px', height: '32px', borderRadius: '50%', 
                        cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' 
                    }}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>
            </div>

            {/* VIEWER AREA */}
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', justifyContent: 'center', background: '#0f172a', padding: '40px' }}>
                <div style={{ 
                    width: '100%', maxWidth: '1000px', height: '100%', background: '#fff', 
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', overflow: 'auto',
                    borderRadius: '4px', position: 'relative'
                }}>
                    {viewMode === 'NATIVE' ? (
                        <iframe 
                            src={viewUrl} 
                            style={{ border: 'none', width: '100%', height: '100%' }}
                            title={filename}
                        />
                    ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                            {/* In a real custom viewer, we'd use react-pdf here. 
                                For this simulation, we'll use an iframe but wrap it with our custom UI. */}
                            <iframe 
                                src={`${viewUrl}#toolbar=0`} 
                                style={{ 
                                    border: 'none', width: '100%', height: '100%',
                                    transform: `scale(${zoom / 100})`,
                                    transformOrigin: 'top center',
                                    transition: 'transform 0.2s ease-in-out'
                                }}
                                title={filename}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* FOOTER / METADATA */}
            <div style={{ background: '#1e293b', padding: '10px 25px', color: '#94a3b8', fontSize: '0.65rem', borderTop: '1px solid #334155', display: 'flex', justifyContent: 'space-between' }}>
                <span>HIPAA_ENCRYPTED_STREAM // AES-256</span>
                <span>DOCUMENT_ID: {documentId}</span>
                <span>VIEW_MODE: {viewMode}</span>
            </div>
        </div>
    );
};

export default DocumentPreviewModal;
