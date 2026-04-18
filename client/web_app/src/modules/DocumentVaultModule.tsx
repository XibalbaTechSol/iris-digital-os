import React, { useState, useEffect, useRef } from 'react';
import DocumentPreviewModal from '../components/DocumentPreviewModal';
/**
 * IRIS OS - Clinical Document Vault
 * Goal: Centralized repository for enrollment forms with compliance scoring.
 */
const DocumentVaultModule: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState<'ALL' | 'CRITICAL' | 'VERIFIED'>('ALL');

    const [documents, setDocuments] = useState<any[]>([]);
    const [selectedDoc, setSelectedDoc] = useState<{ id: string, filename: string } | null>(null);
    const [viewModePreference, setViewModePreference] = useState<'NATIVE' | 'CUSTOM'>('CUSTOM');
    const [autoPublishEnabled, setAutoPublishEnabled] = useState(true);

    useEffect(() => {
        // Fetch all documents for the vault
        fetch('/api/v1/documents')
            .then(res => res.json())
            .then(data => {
                if (data.success && data.documents) {
                    setDocuments(data.documents);
                }
            })
            .catch(err => console.error("Failed to load documents:", err));
    }, []);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploading(true);
        // Base64 encode for simple JSON transmission (to avoid multer dependency just for this)
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64String = reader.result?.toString().split(',')[1];
            try {
                const response = await fetch('/api/v1/documents/upload', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        fileName: file.name,
                        fileType: file.type,
                        fileData: base64String,
                        participant: 'Manual Upload'
                    })
                });
                const result = await response.json();
                if (result.success) {
                    setDocuments([{ id: result.docId, participant: result.participant, type: file.name, status: 'VERIFIED', score: 100, lastAudit: new Date().toISOString().split('T')[0] }, ...documents]);
                }
            } catch (err) {
                console.error("Upload failed", err);
            } finally {
                setUploading(false);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleDownload = (docId: string, filename: string) => {
        window.open(`/api/v1/documents/download/${docId}`, '_blank');
    };

    const filteredDocs = documents.filter(doc => {
        if (filter === 'CRITICAL') return doc.score < 70;
        if (filter === 'VERIFIED') return doc.status === 'VERIFIED';
        return true;
    }).filter(doc => doc.participant.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="module-container" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', alignItems: 'flex-end' }}>
                <div>
                    <h2 style={{ margin: 0 }}>Clinical Document Vault</h2>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Managing audit-ready enrollment and renewal documentation.</p>
                </div>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', background: '#f1f5f9', padding: '5px 12px', borderRadius: '20px', fontSize: '0.65rem', border: '1px solid #e2e8f0' }}>
                        <span style={{ fontWeight: 700, color: '#64748b' }}>VAULT_AUTO_PUBLISH:</span>
                        <button onClick={() => setAutoPublishEnabled(!autoPublishEnabled)} style={{ background: 'none', border: 'none', color: autoPublishEnabled ? '#16a34a' : '#94a3b8', cursor: 'pointer', fontWeight: 800 }}>{autoPublishEnabled ? 'ON' : 'OFF'}</button>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', background: '#f1f5f9', padding: '5px 12px', borderRadius: '20px', fontSize: '0.65rem', border: '1px solid #e2e8f0' }}>
                        <span style={{ fontWeight: 700, color: '#64748b' }}>VIEWER_MODE:</span>
                        <button onClick={() => setViewModePreference(viewModePreference === 'NATIVE' ? 'CUSTOM' : 'NATIVE')} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 800 }}>{viewModePreference}</button>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileUpload} />
                    <button className="primary" style={{ fontSize: '0.7rem', background: '#3b82f6' }} onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                        <i className={`fas ${uploading ? 'fa-spinner fa-spin' : 'fa-upload'}`}></i> {uploading ? 'UPLOADING...' : 'SECURE_UPLOAD'}
                    </button>
                    <button className="secondary" style={{ fontSize: '0.7rem' }}><i className="fas fa-file-export"></i> BULK_CLIENT_EXPORT</button>
                    <button className="primary" style={{ fontSize: '0.7rem' }}><i className="fas fa-shield-halved"></i> TRIGGER_AI_AUDIT_SCAN</button>
                </div>
            </div>

            {/* FILTERS & SEARCH */}
            <div className="card" style={{ padding: '15px', marginBottom: '20px', display: 'flex', gap: '20px', alignItems: 'center' }}>
                <input 
                    className="search-input" 
                    placeholder="Search participant name..." 
                    style={{ flex: 1 }}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div style={{ display: 'flex', gap: '5px' }}>
                    <button onClick={() => setFilter('ALL')} style={{ padding: '6px 12px', borderRadius: '4px', fontSize: '0.7rem', border: '1px solid #cbd5e1', background: filter === 'ALL' ? '#f1f5f9' : '#fff' }}>ALL</button>
                    <button onClick={() => setFilter('CRITICAL')} style={{ padding: '6px 12px', borderRadius: '4px', fontSize: '0.7rem', border: '1px solid #fee2e2', background: filter === 'CRITICAL' ? '#fef2f2' : '#fff', color: '#dc2626' }}>CRITICAL</button>
                    <button onClick={() => setFilter('VERIFIED')} style={{ padding: '6px 12px', borderRadius: '4px', fontSize: '0.7rem', border: '1px solid #dcfce7', background: filter === 'VERIFIED' ? '#f0fdf4' : '#fff', color: '#16a34a' }}>VERIFIED</button>
                </div>
            </div>

            {/* DOCUMENT GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {filteredDocs.map(doc => (
                    <div key={doc.id} className="card" style={{ padding: '15px', borderLeft: `4px solid ${doc.score >= 90 ? '#16a34a' : doc.score >= 70 ? '#f59e0b' : '#dc2626'}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                            <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 800 }}>{doc.id}</span>
                            <span className="status-badge" style={{ background: doc.status === 'VERIFIED' ? 'var(--status-green)' : '#dc2626', color: '#fff' }}>{doc.status}</span>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '5px' }}>{doc.participant_id || doc.participant}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--primary)', marginBottom: '15px' }}>{doc.category || doc.type}</div>
                        
                        <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', marginBottom: '15px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', marginBottom: '5px' }}>
                                <span>AUDIT_COMPLIANCE_SCORE</span>
                                <span style={{ fontWeight: 700 }}>{doc.score || (doc.compliance_status === 'VERIFIED' ? 100 : 50)}%</span>
                            </div>
                            <div style={{ height: '4px', background: '#e2e8f0', borderRadius: '2px' }}>
                                <div style={{ height: '100%', width: `${doc.score || (doc.compliance_status === 'VERIFIED' ? 100 : 50)}%`, background: (doc.score || (doc.compliance_status === 'VERIFIED' ? 100 : 50)) >= 90 ? '#16a34a' : (doc.score || (doc.compliance_status === 'VERIFIED' ? 100 : 50)) >= 70 ? '#f59e0b' : '#dc2626', borderRadius: '2px' }}></div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>LAST_AUDIT: {doc.uploaded_at || doc.lastAudit}</span>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button 
                                    title="View" 
                                    onClick={() => setSelectedDoc({ id: doc.id, filename: doc.filename || doc.type || 'Document' })}
                                    style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}
                                >
                                    <i className="fas fa-eye"></i>
                                </button>
                                <button 
                                    title="Download" 
                                    onClick={() => handleDownload(doc.id, doc.filename || doc.type || 'Document')}
                                    style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}
                                >
                                    <i className="fas fa-download"></i>
                                </button>
                                <button title="Audit Details" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><i className="fas fa-file-shield"></i></button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* PREVIEW MODAL */}
            {selectedDoc && (
                <DocumentPreviewModal 
                    documentId={selectedDoc.id}
                    filename={selectedDoc.filename}
                    viewMode={viewModePreference}
                    onClose={() => setSelectedDoc(null)}
                />
            )}

            {/* AUDIT SHIELD SUMMARY */}
            <div className="card" style={{ marginTop: '30px', background: 'var(--primary)', color: '#fff', padding: '20px' }}>
                <h3 style={{ color: '#fff', margin: 0 }}><i className="fas fa-shield-virus"></i> Audit Shield Intelligence</h3>
                <div style={{ display: 'flex', gap: '40px', marginTop: '20px' }}>
                    <div>
                        <div style={{ fontSize: '0.65rem', opacity: 0.8 }}>TOTAL_FILES_SCANNED</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>1,244</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.65rem', opacity: 0.8 }}>COMPLIANCE_HEALTH</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>92.8%</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.65rem', opacity: 0.8 }}>CRITICAL_GAPS_DETECTED</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#fecaca' }}>14</div>
                    </div>
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
                        <button style={{ background: '#fff', color: 'var(--primary)', border: 'none', padding: '10px 20px', borderRadius: '4px', fontWeight: 700, fontSize: '0.75rem' }}>GENERATE_STATE_AUDIT_REPORT</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DocumentVaultModule;
