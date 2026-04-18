import React, { useState, useEffect, useCallback } from 'react';
import SignatureCanvas from '../components/SignatureCanvas';

type HubTab = 'ASSESSMENTS' | 'TASKS' | 'SCORECARD' | 'FORM';
type TaskFilter = 'ALL' | 'OVERDUE' | 'TODAY' | 'WEEK';

interface Assessment {
    id: string;
    participantId: string;
    participantName: string;
    riskLevel: string;
    assessmentType: string;
    assignedNurseId: string;
    dueDate: string;
    completedDate: string | null;
    status: string;
    urgency: string;
    daysUntilDue: number;
    createdAt: string;
}

interface ComplianceTask {
    id: string;
    consultantId: string;
    participantId: string;
    participantName: string;
    taskType: string;
    title: string;
    description: string;
    priority: string;
    dueDate: string;
    daysUntilDue: number;
    isOverdue: boolean;
    status: string;
    createdAt: string;
}

const TASK_TYPE_ICONS: Record<string, string> = {
    'MONTHLY_CONTACT': 'fa-phone',
    'DOC_CHASE': 'fa-file-circle-exclamation',
    'ISSP_REVIEW': 'fa-clipboard-list',
    'WORKER_COMPLIANCE': 'fa-id-badge',
    'ASSESSMENT_FOLLOWUP': 'fa-stethoscope'
};

const TASK_TYPE_LABELS: Record<string, string> = {
    'MONTHLY_CONTACT': 'Monthly Contact',
    'DOC_CHASE': 'Document Chase',
    'ISSP_REVIEW': 'ISSP Review',
    'WORKER_COMPLIANCE': 'Worker Compliance',
    'ASSESSMENT_FOLLOWUP': 'Assessment Follow-up'
};

const PRIORITY_COLORS: Record<string, string> = {
    'CRITICAL': '#dc2626',
    'HIGH': '#f59e0b',
    'MEDIUM': '#3b82f6',
    'LOW': '#6b7280'
};

const ComplianceHubModule: React.FC = () => {
    const [activeTab, setActiveTab] = useState<HubTab>('ASSESSMENTS');
    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const [overdueAssessments, setOverdueAssessments] = useState<Assessment[]>([]);
    const [tasks, setTasks] = useState<ComplianceTask[]>([]);
    const [taskFilter, setTaskFilter] = useState<TaskFilter>('ALL');
    const [loading, setLoading] = useState(true);

    // Assessment Form State
    const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
    const [formData, setFormData] = useState({
        functionalStatus: '',
        medicationReview: '',
        safetyAssessment: '',
        sdohScreen: '',
        carePlanNotes: ''
    });
    const [signature, setSignature] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [upcomingRes, overdueRes, tasksRes] = await Promise.all([
                fetch('/api/v1/assessments/upcoming?days=90').then(r => r.json()),
                fetch('/api/v1/assessments/overdue').then(r => r.json()),
                fetch('/api/v1/tasks/daily').then(r => r.json())
            ]);

            if (upcomingRes.success) setAssessments(upcomingRes.assessments);
            if (overdueRes.success) setOverdueAssessments(overdueRes.assessments);
            if (tasksRes.success) setTasks(tasksRes.tasks);
        } catch (err) {
            console.error('Failed to fetch compliance data', err);
        }
        setLoading(false);
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleCompleteAssessment = async () => {
        if (!selectedAssessment || !signature) return;
        setSubmitting(true);
        try {
            await fetch('/api/v1/assessments/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    assessmentId: selectedAssessment.id,
                    nurseId: selectedAssessment.assignedNurseId,
                    findings: { ...formData, signatureData: signature }
                })
            });
            setSelectedAssessment(null);
            setFormData({ functionalStatus: '', medicationReview: '', safetyAssessment: '', sdohScreen: '', carePlanNotes: '' });
            setSignature(null);
            await fetchData();
        } catch (err) {
            console.error('Failed to complete assessment', err);
        }
        setSubmitting(false);
    };

    const handleCompleteTask = async (taskId: string) => {
        await fetch(`/api/v1/tasks/${taskId}/complete`, { method: 'POST' });
        await fetchData();
    };

    const handleSnoozeTask = async (taskId: string, days: number = 3) => {
        await fetch(`/api/v1/tasks/${taskId}/snooze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ days })
        });
        await fetchData();
    };

    const allAssessments = [...overdueAssessments, ...assessments.filter(a => a.status !== 'OVERDUE')];

    const filteredTasks = tasks.filter(t => {
        if (taskFilter === 'ALL') return true;
        if (taskFilter === 'OVERDUE') return t.isOverdue;
        if (taskFilter === 'TODAY') return t.daysUntilDue === 0;
        if (taskFilter === 'WEEK') return t.daysUntilDue <= 7 && t.daysUntilDue >= 0;
        return true;
    });

    // Scorecard data aggregation
    const participants = Array.from(new Set(allAssessments.map(a => a.participantId)));
    const scorecard = participants.map(pId => {
        const pAssessments = allAssessments.filter(a => a.participantId === pId);
        const pTasks = tasks.filter(t => t.participantId === pId);
        const name = pAssessments[0]?.participantName || pTasks[0]?.participantName || pId;
        const riskLevel = pAssessments[0]?.riskLevel || 'UNKNOWN';

        const hasOverdueAssessment = pAssessments.some(a => a.status === 'OVERDUE');
        const hasOverdueTask = pTasks.some(t => t.isOverdue);
        const pendingTasks = pTasks.filter(t => !t.isOverdue).length;

        let overallHealth: 'RED' | 'AMBER' | 'GREEN' = 'GREEN';
        if (hasOverdueAssessment || hasOverdueTask) overallHealth = 'RED';
        else if (pendingTasks > 2 || pAssessments.some(a => a.daysUntilDue <= 7)) overallHealth = 'AMBER';

        return { id: pId, name, riskLevel, overallHealth, assessments: pAssessments, tasks: pTasks, hasOverdueAssessment, hasOverdueTask, pendingTasks };
    });

    const TabButton: React.FC<{ id: HubTab; label: string; icon: string; count?: number }> = ({ id, label, icon, count }) => (
        <div
            onClick={() => setActiveTab(id)}
            style={{
                padding: '14px 20px',
                cursor: 'pointer',
                borderBottom: activeTab === id ? '3px solid var(--primary)' : '3px solid transparent',
                fontWeight: activeTab === id ? 700 : 500,
                color: activeTab === id ? 'var(--primary)' : 'var(--text-muted)',
                fontSize: '0.8rem',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s'
            }}
        >
            <i className={`fas ${icon}`} style={{ fontSize: '0.75rem' }}></i>
            {label}
            {count !== undefined && count > 0 && (
                <span style={{
                    background: 'var(--accent-action)',
                    color: '#fff',
                    fontSize: '0.6rem',
                    padding: '2px 6px',
                    borderRadius: '10px',
                    fontWeight: 700
                }}>{count}</span>
            )}
        </div>
    );

    const urgencyColor = (urgency: string) => {
        switch (urgency) {
            case 'OVERDUE': return '#dc2626';
            case 'CRITICAL': return '#dc2626';
            case 'HIGH': return '#f59e0b';
            case 'MEDIUM': return '#3b82f6';
            default: return '#16a34a';
        }
    };

    if (loading) {
        return (
            <div className="module-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
                <div style={{ textAlign: 'center', opacity: 0.5 }}>
                    <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', marginBottom: '15px' }}></i>
                    <div>Loading Compliance Data...</div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ padding: 0 }}>
            {/* Header Stats Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: 'var(--border-color)' }}>
                <div style={{ background: 'var(--card-bg)', padding: '20px 24px' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px' }}>OVERDUE_ASSESSMENTS</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: overdueAssessments.length > 0 ? '#dc2626' : '#16a34a' }}>
                        {overdueAssessments.length}
                    </div>
                </div>
                <div style={{ background: 'var(--card-bg)', padding: '20px 24px' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px' }}>DUE_THIS_WEEK</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f59e0b' }}>
                        {assessments.filter(a => a.daysUntilDue <= 7 && a.daysUntilDue >= 0).length}
                    </div>
                </div>
                <div style={{ background: 'var(--card-bg)', padding: '20px 24px' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px' }}>PENDING_TASKS</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)' }}>
                        {tasks.length}
                    </div>
                </div>
                <div style={{ background: 'var(--card-bg)', padding: '20px 24px' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px' }}>CASELOAD_HEALTH</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: scorecard.every(s => s.overallHealth === 'GREEN') ? '#16a34a' : scorecard.some(s => s.overallHealth === 'RED') ? '#dc2626' : '#f59e0b' }}>
                        {scorecard.filter(s => s.overallHealth === 'GREEN').length}/{scorecard.length}
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div style={{ display: 'flex', background: 'var(--card-bg)', borderBottom: '1px solid var(--border-color)', padding: '0 10px', overflowX: 'auto' }}>
                <TabButton id="ASSESSMENTS" label="Assessment Tracker" icon="fa-stethoscope" count={overdueAssessments.length} />
                <TabButton id="TASKS" label="Daily Task Queue" icon="fa-list-check" count={tasks.filter(t => t.isOverdue).length} />
                <TabButton id="SCORECARD" label="Caseload Scorecard" icon="fa-chart-bar" />
                <TabButton id="FORM" label="Assessment Form" icon="fa-file-medical-alt" />
            </div>

            <div style={{ padding: '20px' }}>
                {/* ===== TAB 1: ASSESSMENT TRACKER ===== */}
                {activeTab === 'ASSESSMENTS' && (
                    <div>
                        {allAssessments.length === 0 ? (
                            <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
                                <i className="fas fa-check-circle" style={{ fontSize: '3rem', color: '#16a34a', marginBottom: '15px' }}></i>
                                <h3>All Assessments Current</h3>
                                <p style={{ color: 'var(--text-muted)' }}>No upcoming or overdue assessments in your caseload.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gap: '12px' }}>
                                {allAssessments.map(a => (
                                    <div
                                        key={a.id}
                                        className="card"
                                        style={{
                                            borderLeft: `4px solid ${urgencyColor(a.urgency)}`,
                                            padding: '18px 24px',
                                            display: 'grid',
                                            gridTemplateColumns: '1fr auto',
                                            gap: '20px',
                                            alignItems: 'center',
                                            transition: 'all 0.2s',
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => {
                                            setSelectedAssessment(a);
                                            setActiveTab('FORM');
                                        }}
                                    >
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                                <span style={{
                                                    width: '32px', height: '32px', borderRadius: '50%',
                                                    background: urgencyColor(a.urgency) + '20',
                                                    color: urgencyColor(a.urgency),
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: '0.8rem', fontWeight: 700
                                                }}>
                                                    <i className="fas fa-stethoscope"></i>
                                                </span>
                                                <div>
                                                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{a.participantName}</div>
                                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                                        {a.participantId} • {a.assessmentType.replace('_', '-')} Cycle • Nurse: {a.assignedNurseId}
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '10px', fontSize: '0.7rem' }}>
                                                <span className="status-badge" style={{ background: urgencyColor(a.urgency) + '15', color: urgencyColor(a.urgency) }}>
                                                    {a.status}
                                                </span>
                                                <span className="status-badge" style={{ background: a.riskLevel === 'HIGH' ? '#fef2f2' : '#f0fdf4', color: a.riskLevel === 'HIGH' ? '#dc2626' : '#16a34a' }}>
                                                    {a.riskLevel}_RISK
                                                </span>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{
                                                fontSize: '1.5rem',
                                                fontWeight: 800,
                                                color: urgencyColor(a.urgency)
                                            }}>
                                                {a.daysUntilDue < 0 ? `${Math.abs(a.daysUntilDue)}d` : `${a.daysUntilDue}d`}
                                            </div>
                                            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                                                {a.daysUntilDue < 0 ? 'OVERDUE' : 'REMAINING'}
                                            </div>
                                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                                Due: {new Date(a.dueDate).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ===== TAB 2: DAILY TASK QUEUE ===== */}
                {activeTab === 'TASKS' && (
                    <div>
                        {/* Filter Bar */}
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                            {(['ALL', 'OVERDUE', 'TODAY', 'WEEK'] as TaskFilter[]).map(f => (
                                <button
                                    key={f}
                                    onClick={() => setTaskFilter(f)}
                                    style={{
                                        padding: '8px 16px',
                                        fontSize: '0.7rem',
                                        fontWeight: 600,
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '6px',
                                        background: taskFilter === f ? 'var(--primary)' : 'var(--card-bg)',
                                        color: taskFilter === f ? '#fff' : 'var(--text-muted)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {f === 'ALL' ? `All (${tasks.length})` :
                                     f === 'OVERDUE' ? `Overdue (${tasks.filter(t => t.isOverdue).length})` :
                                     f === 'TODAY' ? `Today (${tasks.filter(t => t.daysUntilDue === 0).length})` :
                                     `This Week (${tasks.filter(t => t.daysUntilDue <= 7 && t.daysUntilDue >= 0).length})`}
                                </button>
                            ))}
                            <div style={{ marginLeft: 'auto' }}>
                                <button
                                    className="primary"
                                    style={{ fontSize: '0.7rem', padding: '8px 16px' }}
                                    onClick={async () => {
                                        await fetch('/api/v1/tasks/auto-generate', { method: 'POST' });
                                        await fetchData();
                                    }}
                                >
                                    <i className="fas fa-wand-magic-sparkles"></i> AUTO_GENERATE
                                </button>
                            </div>
                        </div>

                        {filteredTasks.length === 0 ? (
                            <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
                                <i className="fas fa-clipboard-check" style={{ fontSize: '3rem', color: '#16a34a', marginBottom: '15px' }}></i>
                                <h3>All Clear</h3>
                                <p style={{ color: 'var(--text-muted)' }}>No tasks matching this filter.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gap: '10px' }}>
                                {filteredTasks.map(t => (
                                    <div
                                        key={t.id}
                                        className="card"
                                        style={{
                                            padding: '16px 20px',
                                            borderLeft: `4px solid ${PRIORITY_COLORS[t.priority] || '#6b7280'}`,
                                            display: 'grid',
                                            gridTemplateColumns: '40px 1fr auto',
                                            gap: '16px',
                                            alignItems: 'center',
                                            opacity: t.status === 'COMPLETED' ? 0.5 : 1,
                                            transition: 'all 0.3s'
                                        }}
                                    >
                                        <div style={{
                                            width: '40px', height: '40px', borderRadius: '10px',
                                            background: (PRIORITY_COLORS[t.priority] || '#6b7280') + '15',
                                            color: PRIORITY_COLORS[t.priority] || '#6b7280',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '1rem'
                                        }}>
                                            <i className={`fas ${TASK_TYPE_ICONS[t.taskType] || 'fa-tasks'}`}></i>
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '4px' }}>{t.title}</div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '6px', lineHeight: 1.4 }}>{t.description}</div>
                                            <div style={{ display: 'flex', gap: '8px', fontSize: '0.6rem' }}>
                                                <span className="status-badge" style={{ background: (PRIORITY_COLORS[t.priority] || '#6b7280') + '15', color: PRIORITY_COLORS[t.priority] }}>{t.priority}</span>
                                                <span className="status-badge">{TASK_TYPE_LABELS[t.taskType] || t.taskType}</span>
                                                <span className="status-badge" style={{ background: '#f8fafc' }}>{t.participantName}</span>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                                            <div style={{
                                                fontSize: '0.75rem', fontWeight: 700,
                                                color: t.isOverdue ? '#dc2626' : t.daysUntilDue <= 1 ? '#f59e0b' : 'var(--text-muted)'
                                            }}>
                                                {t.isOverdue ? `${Math.abs(t.daysUntilDue)}d overdue` :
                                                 t.daysUntilDue === 0 ? 'Due today' :
                                                 `${t.daysUntilDue}d left`}
                                            </div>
                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleCompleteTask(t.id); }}
                                                    style={{
                                                        padding: '4px 10px', fontSize: '0.6rem', fontWeight: 600,
                                                        background: '#16a34a', color: '#fff', border: 'none',
                                                        borderRadius: '4px', cursor: 'pointer'
                                                    }}
                                                >
                                                    <i className="fas fa-check"></i> DONE
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleSnoozeTask(t.id, 3); }}
                                                    style={{
                                                        padding: '4px 10px', fontSize: '0.6rem', fontWeight: 600,
                                                        background: 'none', color: 'var(--text-muted)', border: '1px solid var(--border-color)',
                                                        borderRadius: '4px', cursor: 'pointer'
                                                    }}
                                                >
                                                    <i className="fas fa-clock"></i> +3d
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ===== TAB 3: CASELOAD SCORECARD ===== */}
                {activeTab === 'SCORECARD' && (
                    <div>
                        <div className="card" style={{ marginBottom: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h3 style={{ margin: 0 }}><i className="fas fa-chart-bar"></i> Caseload Compliance Scorecard</h3>
                                <span className="status-badge blue">HIPAA_COMPLIANT</span>
                            </div>
                            <table className="audit-table" style={{ width: '100%' }}>
                                <thead>
                                    <tr>
                                        <th>PARTICIPANT</th>
                                        <th>RISK_LEVEL</th>
                                        <th>ASSESSMENTS</th>
                                        <th>PENDING_TASKS</th>
                                        <th>OVERDUE</th>
                                        <th>HEALTH</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {scorecard.map(s => (
                                        <tr key={s.id}>
                                            <td style={{ fontWeight: 700 }}>
                                                <div>{s.name}</div>
                                                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{s.id}</div>
                                            </td>
                                            <td>
                                                <span className={`status-badge ${s.riskLevel === 'HIGH' ? 'red' : s.riskLevel === 'MODERATE' ? '' : 'green'}`}
                                                      style={s.riskLevel === 'MODERATE' ? { background: '#f59e0b', color: '#fff' } : undefined}>
                                                    {s.riskLevel}
                                                </span>
                                            </td>
                                            <td>
                                                {s.hasOverdueAssessment ? (
                                                    <span style={{ color: '#dc2626', fontWeight: 700 }}><i className="fas fa-exclamation-circle"></i> OVERDUE</span>
                                                ) : (
                                                    <span style={{ color: '#16a34a', fontWeight: 600 }}><i className="fas fa-check-circle"></i> Current</span>
                                                )}
                                            </td>
                                            <td style={{ fontWeight: 600 }}>{s.pendingTasks}</td>
                                            <td>
                                                {s.hasOverdueTask ? (
                                                    <span style={{ color: '#dc2626', fontWeight: 700 }}><i className="fas fa-flag"></i> Yes</span>
                                                ) : (
                                                    <span style={{ color: '#16a34a' }}>No</span>
                                                )}
                                            </td>
                                            <td>
                                                <div style={{
                                                    width: '12px', height: '12px', borderRadius: '50%',
                                                    background: s.overallHealth === 'GREEN' ? '#16a34a' : s.overallHealth === 'AMBER' ? '#f59e0b' : '#dc2626',
                                                    display: 'inline-block',
                                                    boxShadow: `0 0 8px ${s.overallHealth === 'GREEN' ? '#16a34a' : s.overallHealth === 'AMBER' ? '#f59e0b' : '#dc2626'}40`
                                                }}></div>
                                            </td>
                                        </tr>
                                    ))}
                                    {scorecard.length === 0 && (
                                        <tr><td colSpan={6} style={{ textAlign: 'center', opacity: 0.5 }}>No participant data available.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ===== TAB 4: ASSESSMENT FORM ===== */}
                {activeTab === 'FORM' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div className="card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h3 style={{ margin: 0 }}><i className="fas fa-file-medical-alt"></i> Clinical Assessment Form</h3>
                                <span className="status-badge blue">HIPAA_ENCRYPTED</span>
                            </div>

                            {!selectedAssessment ? (
                                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                    <i className="fas fa-stethoscope" style={{ fontSize: '2.5rem', color: 'var(--text-muted)', marginBottom: '15px', opacity: 0.3 }}></i>
                                    <p style={{ color: 'var(--text-muted)' }}>Select an assessment from the Assessment Tracker to begin.</p>
                                    <button className="primary" style={{ marginTop: '10px', fontSize: '0.75rem' }}
                                            onClick={() => setActiveTab('ASSESSMENTS')}>
                                        <i className="fas fa-arrow-left"></i> GO_TO_TRACKER
                                    </button>
                                </div>
                            ) : (
                                <div>
                                    <div style={{
                                        background: 'var(--primary-light, #eef2ff)', padding: '15px', borderRadius: '8px', marginBottom: '20px',
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                    }}>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{selectedAssessment.participantName}</div>
                                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                                {selectedAssessment.participantId} • {selectedAssessment.assessmentType.replace('_', '-')} Assessment
                                            </div>
                                        </div>
                                        <span className={`status-badge ${selectedAssessment.riskLevel === 'HIGH' ? 'red' : 'green'}`}>
                                            {selectedAssessment.riskLevel}_RISK
                                        </span>
                                    </div>

                                    {/* Form Fields */}
                                    <div style={{ display: 'grid', gap: '16px' }}>
                                        <div>
                                            <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                                                <i className="fas fa-walking"></i> FUNCTIONAL_STATUS
                                            </label>
                                            <textarea
                                                className="search-input"
                                                rows={3}
                                                style={{ width: '100%' }}
                                                placeholder="ADLs, mobility, cognitive status, changes since last assessment..."
                                                value={formData.functionalStatus}
                                                onChange={e => setFormData(prev => ({ ...prev, functionalStatus: e.target.value }))}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                                                <i className="fas fa-pills"></i> MEDICATION_REVIEW
                                            </label>
                                            <textarea
                                                className="search-input"
                                                rows={3}
                                                style={{ width: '100%' }}
                                                placeholder="Current medications, compliance, side effects, pharmacy coordination..."
                                                value={formData.medicationReview}
                                                onChange={e => setFormData(prev => ({ ...prev, medicationReview: e.target.value }))}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                                                <i className="fas fa-shield-alt"></i> SAFETY_ASSESSMENT
                                            </label>
                                            <textarea
                                                className="search-input"
                                                rows={3}
                                                style={{ width: '100%' }}
                                                placeholder="Fall risk, home safety, abuse/neglect screening, emergency plan..."
                                                value={formData.safetyAssessment}
                                                onChange={e => setFormData(prev => ({ ...prev, safetyAssessment: e.target.value }))}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                                                <i className="fas fa-house-user"></i> SDOH_SCREEN
                                            </label>
                                            <textarea
                                                className="search-input"
                                                rows={2}
                                                style={{ width: '100%' }}
                                                placeholder="Food security, housing stability, transportation, social isolation..."
                                                value={formData.sdohScreen}
                                                onChange={e => setFormData(prev => ({ ...prev, sdohScreen: e.target.value }))}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                                                <i className="fas fa-clipboard-list"></i> CARE_PLAN_NOTES
                                            </label>
                                            <textarea
                                                className="search-input"
                                                rows={3}
                                                style={{ width: '100%' }}
                                                placeholder="Changes to care plan, recommendations, follow-up actions..."
                                                value={formData.carePlanNotes}
                                                onChange={e => setFormData(prev => ({ ...prev, carePlanNotes: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right Column: Signature & Submit */}
                        <div>
                            {selectedAssessment && (
                                <>
                                    <div className="card" style={{ marginBottom: '20px' }}>
                                        <h4 style={{ margin: '0 0 15px' }}><i className="fas fa-signature"></i> Nurse Signature</h4>
                                        <div style={{
                                            background: '#f8fafc', padding: '10px', borderRadius: '6px',
                                            fontSize: '0.65rem', color: 'var(--primary)', marginBottom: '15px'
                                        }}>
                                            <i className="fas fa-shield-alt"></i> DIGITAL_SIGNATURE_REQUIRED — Per DHS clinical documentation standards
                                        </div>
                                        <SignatureCanvas onSave={(blob) => setSignature(blob)} />
                                    </div>

                                    <button
                                        className="primary"
                                        style={{
                                            width: '100%', padding: '14px',
                                            fontSize: '0.85rem', fontWeight: 700
                                        }}
                                        disabled={!signature || submitting || !formData.functionalStatus}
                                        onClick={handleCompleteAssessment}
                                    >
                                        {submitting ? (
                                            <><i className="fas fa-spinner fa-spin"></i> PROCESSING...</>
                                        ) : (
                                            <><i className="fas fa-check-circle"></i> SIGN_&_COMPLETE_ASSESSMENT</>
                                        )}
                                    </button>

                                    {(!signature || !formData.functionalStatus) && (
                                        <div style={{ marginTop: '10px', fontSize: '0.65rem', color: '#f59e0b', textAlign: 'center' }}>
                                            <i className="fas fa-exclamation-triangle"></i> Functional status and signature are required to complete
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Quick Stats */}
                            <div className="card" style={{ marginTop: '20px', background: 'var(--primary)', color: '#fff' }}>
                                <h4 style={{ color: '#fff', margin: '0 0 15px' }}><i className="fas fa-info-circle"></i> Assessment Protocol</h4>
                                <div style={{ fontSize: '0.75rem', lineHeight: 1.6, opacity: 0.9 }}>
                                    <div style={{ marginBottom: '10px' }}>
                                        <strong>60-Day Cycle:</strong> For HIGH-risk participants. Includes functional status, fall risk, and medication reconciliation.
                                    </div>
                                    <div style={{ marginBottom: '10px' }}>
                                        <strong>90-Day Cycle:</strong> For STANDARD participants. Includes wellness check, SDOH screening, and care plan review.
                                    </div>
                                    <div>
                                        <strong>Documentation:</strong> All findings are AES-256-GCM encrypted and logged to the HIPAA audit trail.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ComplianceHubModule;
