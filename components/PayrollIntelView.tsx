'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef } from 'react';
import {
  AlertTriangle, CheckCircle, Upload, Users,
  TrendingUp, Shield, Zap, ChevronDown, ChevronUp,
  Plus, Trash2, Download, ClipboardList, FolderOpen, PenLine
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface PayrollIntelViewProps {}

const ANOMALY_COLORS: Record<string, { color: string; bg: string; label: string }> = {
  ghost_employee:  { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   label: '👻 Ghost Employee' },
  salary_spike:    { color: '#f97316', bg: 'rgba(249,115,22,0.12)',  label: '📈 Salary Spike' },
  duplicate_entry: { color: '#eab308', bg: 'rgba(234,179,8,0.12)',   label: '🔁 Duplicate Entry' },
  overpayment:     { color: '#a855f7', bg: 'rgba(168,85,247,0.12)',  label: '💸 Overpayment' },
  ml_anomaly:      { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  label: '🤖 ML Anomaly' },
};

const RISK_CONFIG: Record<string, { color: string; bg: string }> = {
  High:   { color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
  Medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  Low:    { color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
};

const JOB_ROLES = [
  'Sales Executive', 'Research Scientist', 'Laboratory Technician',
  'Manufacturing Director', 'Healthcare Representative', 'Manager',
  'Human Resources', 'Marketing', 'Sales Representative', 'Research Director', 'Other',
];

const DEPARTMENTS = [
  'Engineering', 'Sales', 'Marketing', 'HR', 'Finance',
  'Research', 'Operations', 'Legal', 'Product', 'Design',
];

// ── Empty row template ─────────────────────────────────────────────────────────
const emptyRow = () => ({
  employee_id: '',
  name: '',
  department: '',
  JobRole: '',
  MonthlyIncome: '',
  YearsAtCompany: '',
  PerformanceRating: '3',
  OverTime: 'No',
});

// ── Sample data ────────────────────────────────────────────────────────────────
const SAMPLE_RECORDS = [
  { employee_id: 'E001', name: 'Alice Chen',      department: 'Engineering', JobRole: 'Research Scientist',  MonthlyIncome: 7916,  YearsAtCompany: 5, PerformanceRating: 3, OverTime: 'No'  },
  { employee_id: 'E002', name: 'Bob Martin',      department: 'Sales',       JobRole: 'Sales Executive',     MonthlyIncome: 5000,  YearsAtCompany: 2, PerformanceRating: 2, OverTime: 'Yes' },
  { employee_id: 'E003', name: 'Charlie Ghost',   department: '',            JobRole: 'Manager',             MonthlyIncome: 9000,  YearsAtCompany: 1, PerformanceRating: 3, OverTime: 'No'  },
  { employee_id: 'E004', name: 'Diana High',      department: 'HR',          JobRole: 'Human Resources',     MonthlyIncome: 18000, YearsAtCompany: 3, PerformanceRating: 4, OverTime: 'No'  },
  { employee_id: 'E001', name: 'Alice Chen (dup)',department: 'Engineering', JobRole: 'Research Scientist',  MonthlyIncome: 7916,  YearsAtCompany: 5, PerformanceRating: 3, OverTime: 'No'  },
];

// ── CSV template ───────────────────────────────────────────────────────────────
const CSV_HEADERS = ['employee_id', 'name', 'department', 'JobRole', 'MonthlyIncome', 'YearsAtCompany', 'PerformanceRating', 'OverTime'];

function downloadCsvTemplate() {
  const sampleRow = 'E001,John Doe,Engineering,Research Scientist,7916,5,3,No';
  const content = [CSV_HEADERS.join(','), sampleRow].join('\n');
  const blob = new Blob([content], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'payroll_template.csv'; a.click();
  URL.revokeObjectURL(url);
}

// ── CSV text parser (shared by file upload and paste) ─────────────────────────
function parseCsv(text: string): any[] {
  const lines = text.trim().split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
    const row: any = {};
    headers.forEach((h, i) => { row[h] = values[i] ?? ''; });
    return row;
  });
}

type InputTab = 'upload' | 'manual' | 'paste';

// ── Inline text input style ───────────────────────────────────────────────────
const cellStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  padding: '7px 10px',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px',
  color: 'white', fontSize: '12px', outline: 'none',
};

export function PayrollIntelView({}: PayrollIntelViewProps) {
  const [inputTab, setInputTab]         = useState<InputTab>('upload');
  const [records, setRecords]           = useState<any[]>([]);
  const [manualRows, setManualRows]     = useState<any[]>([emptyRow()]);
  const [pasteText, setPasteText]       = useState('');
  const [pasteError, setPasteError]     = useState('');
  const [companyName, setCompanyName]   = useState('');
  const [result, setResult]             = useState<any>(null);
  const [isLoading, setIsLoading]       = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [expanded, setExpanded]         = useState<number | null>(null);
  const [fileName, setFileName]         = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Active records derive from the selected tab ───────────────────────────
  const getActiveRecords = (): any[] => {
    if (inputTab === 'upload') return records;
    if (inputTab === 'manual') return manualRows.filter(r => r.employee_id.trim() !== '');
    if (inputTab === 'paste') {
      try { return parseCsv(pasteText); } catch { return []; }
    }
    return [];
  };

  const activeRecords = getActiveRecords();

  // ── File upload ──────────────────────────────────────────────────────────
  const handleFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(text);
          setRecords(Array.isArray(parsed) ? parsed : [parsed]);
          setError(null);
        } else if (file.name.endsWith('.csv')) {
          const rows = parseCsv(text);
          if (rows.length === 0) { setError('CSV appears empty or headers are missing.'); return; }
          setRecords(rows);
          setError(null);
        } else {
          setError('Please upload a .json or .csv file.');
        }
      } catch { setError('Failed to parse file. Ensure it is valid JSON or CSV.'); }
    };
    reader.readAsText(file);
  };

  // ── Manual row helpers ────────────────────────────────────────────────────
  const updateRow = (idx: number, field: string, value: string) => {
    setManualRows(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  };
  const addRow    = () => setManualRows(prev => [...prev, emptyRow()]);
  const deleteRow = (idx: number) => setManualRows(prev => prev.filter((_, i) => i !== idx));

  // ── Paste parser on-the-fly ───────────────────────────────────────────────
  const handlePasteChange = (text: string) => {
    setPasteText(text);
    try {
      const rows = parseCsv(text);
      setPasteError(rows.length > 0 ? '' : 'No valid rows found. Check that the first line is a header.');
    } catch { setPasteError('Invalid CSV format.'); }
  };

  // ── Load sample data ──────────────────────────────────────────────────────
  const loadSample = () => {
    if (inputTab === 'upload') {
      setRecords(SAMPLE_RECORDS);
      setFileName('sample_payroll.json');
    } else if (inputTab === 'manual') {
      setManualRows(SAMPLE_RECORDS.map(r => ({
        ...r,
        MonthlyIncome: String(r.MonthlyIncome),
        YearsAtCompany: String(r.YearsAtCompany),
        PerformanceRating: String(r.PerformanceRating),
      })));
    } else {
      const lines = [CSV_HEADERS.join(','), ...SAMPLE_RECORDS.map(r =>
        [r.employee_id, r.name, r.department, r.JobRole, r.MonthlyIncome, r.YearsAtCompany, r.PerformanceRating, r.OverTime].join(',')
      )];
      setPasteText(lines.join('\n'));
      setPasteError('');
    }
    setCompanyName('Demo Corp');
    setError(null);
  };

  // ── Run analysis ──────────────────────────────────────────────────────────
  const handleAnalyze = async () => {
    const toSend = activeRecords;
    if (toSend.length === 0) { setError('No records to analyze. Add rows, upload a file, or paste CSV data.'); return; }
    setIsLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch(`${API_BASE}/payroll/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records: toSend, company_name: companyName || 'Unknown' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Analysis failed');
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to backend. Ensure the Python server is running.');
    } finally { setIsLoading(false); }
  };

  const analysis = result?.analysis;

  // ── Shared button style helper ────────────────────────────────────────────
  const tabBtn = (tab: InputTab, label: string, Icon: any) => {
    const active = inputTab === tab;
    return (
      <button
        onClick={() => { setInputTab(tab); setError(null); setResult(null); setExpanded(null); }}
        style={{
          flex: 1, padding: '10px 6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
          background: active ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.04)',
          border: active ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(255,255,255,0.08)',
          borderRadius: '10px', color: active ? '#fca5a5' : 'rgba(255,255,255,0.45)',
          fontSize: '13px', fontWeight: active ? 700 : 500, cursor: 'pointer', transition: 'all 0.2s'
        }}
      >
        <Icon size={14} /> {label}
      </button>
    );
  };

  return (
    <div style={{ maxWidth: '1150px', margin: '0 auto' }}>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', marginBottom: '36px' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '12px',
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
          borderRadius: '50px', padding: '8px 20px', marginBottom: '16px',
        }}>
          <Shield size={16} color="#ef4444" />
          <span style={{ color: '#fca5a5', fontSize: '13px', fontWeight: 600 }}>
            Isolation Forest ML · Rule Engine · 4 Anomaly Classes
          </span>
        </div>
        <h2 style={{ fontSize: '32px', fontWeight: 800, color: 'white', marginBottom: '8px' }}>
          Payroll Intel — Anomaly Detection
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '16px' }}>
          Enterprise payroll fraud & anomaly detection powered by a trained ML model
        </p>
      </motion.div>

      {/* ── Main Input Card ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        style={{
          background: 'linear-gradient(135deg, rgba(239,68,68,0.07) 0%, rgba(12,12,28,0.97) 100%)',
          border: '1px solid rgba(239,68,68,0.2)', borderRadius: '24px',
          padding: '28px', marginBottom: '24px',
        }}
      >
        {/* ── Company name + sample + download row ────────────────────────── */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
          <input
            value={companyName} onChange={e => setCompanyName(e.target.value)}
            placeholder="Company name (e.g. Acme Corp)"
            style={{
              flex: 1, minWidth: '180px', padding: '10px 14px',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '10px', color: 'white', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
            }}
            onFocus={e => e.target.style.borderColor = 'rgba(239,68,68,0.5)'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
          />
          <button
            onClick={loadSample}
            style={{
              padding: '10px 16px', background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px',
              color: 'rgba(255,255,255,0.65)', fontSize: '13px', fontWeight: 500,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.11)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
          >
            ✨ Load Sample
          </button>
          <button
            onClick={downloadCsvTemplate}
            style={{
              padding: '10px 16px', background: 'rgba(16,185,129,0.08)',
              border: '1px solid rgba(16,185,129,0.25)', borderRadius: '10px',
              color: '#34d399', fontSize: '13px', fontWeight: 500,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(16,185,129,0.15)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(16,185,129,0.08)'}
          >
            <Download size={14} /> CSV Template
          </button>
        </div>

        {/* ── Tab switcher ────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          {tabBtn('upload', 'Upload File',     FolderOpen)}
          {tabBtn('manual', 'Manual Entry',    PenLine)}
          {tabBtn('paste',  'Paste CSV',       ClipboardList)}
        </div>

        {/* ══ TAB: Upload ════════════════════════════════════════════════════ */}
        {inputTab === 'upload' && (
          <div>
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
              style={{
                border: '2px dashed rgba(239,68,68,0.35)', borderRadius: '16px',
                padding: '36px', textAlign: 'center', cursor: 'pointer',
                background: 'rgba(255,255,255,0.02)', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(239,68,68,0.65)'; e.currentTarget.style.background = 'rgba(239,68,68,0.05)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(239,68,68,0.35)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
            >
              <Upload size={32} color="rgba(239,68,68,0.65)" style={{ margin: '0 auto 12px' }} />
              {fileName && records.length > 0 ? (
                <>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#fca5a5', marginBottom: '4px' }}>{fileName}</div>
                  <div style={{ fontSize: '13px', color: '#10b981' }}>✓ {records.length} records loaded</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}>
                    Drop .json or .csv here
                  </div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>or click to browse</div>
                </>
              )}
            </div>
            <input ref={fileRef} type="file" accept=".json,.csv" style={{ display: 'none' }}
              onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
          </div>
        )}

        {/* ══ TAB: Manual Entry ══════════════════════════════════════════════ */}
        {inputTab === 'manual' && (
          <div>
            {/* Scrollable table */}
            <div style={{ overflowX: 'auto', marginBottom: '14px' }}>
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 6px', minWidth: '860px' }}>
                <thead>
                  <tr>
                    {['#', 'Employee ID *', 'Name', 'Department', 'Job Role', 'Monthly Income (USD) *', 'Years at Company', 'Rating', 'OT', ''].map(h => (
                      <th key={h} style={{
                        fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.35)',
                        textTransform: 'uppercase', letterSpacing: '0.5px',
                        padding: '4px 8px', textAlign: 'left', whiteSpace: 'nowrap',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {manualRows.map((row, idx) => (
                    <tr key={idx} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
                      {/* Row number */}
                      <td style={{ padding: '4px 8px', fontSize: '11px', color: 'rgba(255,255,255,0.25)', textAlign: 'center', minWidth: '28px' }}>
                        {idx + 1}
                      </td>
                      {/* Employee ID */}
                      <td style={{ padding: '4px 8px', minWidth: '90px' }}>
                        <input value={row.employee_id} onChange={e => updateRow(idx, 'employee_id', e.target.value)}
                          placeholder="E001" style={{ ...cellStyle, borderColor: !row.employee_id.trim() ? 'rgba(239,68,68,0.4)' : undefined }} />
                      </td>
                      {/* Name */}
                      <td style={{ padding: '4px 8px', minWidth: '110px' }}>
                        <input value={row.name} onChange={e => updateRow(idx, 'name', e.target.value)}
                          placeholder="Full Name" style={cellStyle} />
                      </td>
                      {/* Department */}
                      <td style={{ padding: '4px 8px', minWidth: '130px' }}>
                        <select value={row.department} onChange={e => updateRow(idx, 'department', e.target.value)}
                          style={{ ...cellStyle, appearance: 'none' }}>
                          <option value="">No Department</option>
                          {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </td>
                      {/* Job Role */}
                      <td style={{ padding: '4px 8px', minWidth: '155px' }}>
                        <select value={row.JobRole} onChange={e => updateRow(idx, 'JobRole', e.target.value)}
                          style={{ ...cellStyle, appearance: 'none' }}>
                          <option value="">Select Role</option>
                          {JOB_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </td>
                      {/* Monthly Income */}
                      <td style={{ padding: '4px 8px', minWidth: '110px' }}>
                        <input type="number" min="0" value={row.MonthlyIncome}
                          onChange={e => updateRow(idx, 'MonthlyIncome', e.target.value)}
                          placeholder="5000" style={cellStyle} />
                      </td>
                      {/* Years */}
                      <td style={{ padding: '4px 8px', minWidth: '80px' }}>
                        <input type="number" min="0" max="50" value={row.YearsAtCompany}
                          onChange={e => updateRow(idx, 'YearsAtCompany', e.target.value)}
                          placeholder="3" style={cellStyle} />
                      </td>
                      {/* Rating 1-4 */}
                      <td style={{ padding: '4px 8px', minWidth: '60px' }}>
                        <select value={row.PerformanceRating} onChange={e => updateRow(idx, 'PerformanceRating', e.target.value)}
                          style={{ ...cellStyle, appearance: 'none' }}>
                          {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                      </td>
                      {/* Overtime */}
                      <td style={{ padding: '4px 8px', minWidth: '60px' }}>
                        <select value={row.OverTime} onChange={e => updateRow(idx, 'OverTime', e.target.value)}
                          style={{ ...cellStyle, appearance: 'none' }}>
                          <option value="No">No</option>
                          <option value="Yes">Yes</option>
                        </select>
                      </td>
                      {/* Delete */}
                      <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                        <button onClick={() => deleteRow(idx)} style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: 'rgba(239,68,68,0.5)', padding: '4px',
                          borderRadius: '6px', display: 'flex', alignItems: 'center',
                        }}
                          onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                          onMouseLeave={e => e.currentTarget.style.color = 'rgba(239,68,68,0.5)'}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Add row */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button
                onClick={addRow}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '9px 18px', background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px',
                  color: '#fca5a5', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.18)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
              >
                <Plus size={14} /> Add Row
              </button>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>
                {manualRows.filter(r => r.employee_id.trim()).length} valid row{manualRows.filter(r => r.employee_id.trim()).length !== 1 ? 's' : ''} · Employee ID required *
              </span>
            </div>
          </div>
        )}

        {/* ══ TAB: Paste CSV ═════════════════════════════════════════════════ */}
        {inputTab === 'paste' && (
          <div>
            <div style={{ marginBottom: '10px', fontSize: '12px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
              Paste CSV text below. First line must be headers. Download the{' '}
              <span
                onClick={downloadCsvTemplate}
                style={{ color: '#34d399', cursor: 'pointer', textDecoration: 'underline' }}
              >
                CSV template
              </span>{' '}
              to see the required format.
            </div>
            <textarea
              value={pasteText}
              onChange={e => handlePasteChange(e.target.value)}
              placeholder={`employee_id,name,department,JobRole,MonthlyIncome,YearsAtCompany,PerformanceRating,OverTime\nE001,Alice Chen,Engineering,Research Scientist,7916,5,3,No\nE002,Bob Smith,Sales,Sales Executive,5000,2,2,Yes`}
              rows={10}
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '14px 16px',
                background: 'rgba(255,255,255,0.04)',
                border: pasteError ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: '14px', color: 'rgba(255,255,255,0.85)',
                fontSize: '12px', fontFamily: 'monospace', lineHeight: 1.7,
                resize: 'vertical', outline: 'none',
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(239,68,68,0.5)'}
              onBlur={e => e.target.style.borderColor = pasteError ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}
            />
            {/* Live preview count */}
            <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {pasteError
                ? <span style={{ fontSize: '12px', color: '#ef4444' }}>⚠ {pasteError}</span>
                : pasteText.trim()
                  ? <span style={{ fontSize: '12px', color: '#10b981' }}>✓ {parseCsv(pasteText).length} rows parsed</span>
                  : <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)' }}>Awaiting input…</span>
              }
              {pasteText && (
                <button
                  onClick={() => { setPasteText(''); setPasteError(''); }}
                  style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Record count + Analyze button ───────────────────────────────── */}
        <div style={{
          display: 'flex', gap: '16px', alignItems: 'center',
          marginTop: '20px', paddingTop: '20px',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          flexWrap: 'wrap',
        }}>
          {/* Stats mini-row */}
          <div style={{ display: 'flex', gap: '20px' }}>
            {[
              { label: 'Records', value: activeRecords.length, color: 'white' },
              { label: 'Ready',   value: activeRecords.length > 0 ? '✓' : '—', color: activeRecords.length > 0 ? '#10b981' : 'rgba(255,255,255,0.25)' },
              { label: 'Checks',  value: '4', color: '#3b82f6' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '22px', fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
              </div>
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={handleAnalyze}
            disabled={isLoading || activeRecords.length === 0}
            style={{
              marginLeft: 'auto', padding: '13px 32px',
              background: activeRecords.length > 0
                ? 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)'
                : 'rgba(255,255,255,0.07)',
              border: 'none', borderRadius: '12px',
              color: activeRecords.length > 0 ? 'white' : 'rgba(255,255,255,0.25)',
              fontSize: '15px', fontWeight: 700,
              cursor: activeRecords.length > 0 ? 'pointer' : 'not-allowed',
              opacity: isLoading ? 0.7 : 1,
              transition: 'all 0.2s', whiteSpace: 'nowrap',
            }}
          >
            {isLoading ? '🔍 Analyzing…' : '🚨 Run Anomaly Detection'}
          </motion.button>
        </div>

        {error && (
          <div style={{ marginTop: '14px', padding: '12px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px' }}>
            <p style={{ color: '#fca5a5', fontSize: '13px', lineHeight: 1.5, margin: 0 }}>{error}</p>
          </div>
        )}
      </motion.div>

      {/* ── Results ──────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {analysis && (
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>

            {/* KPI row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))', gap: '14px', marginBottom: '24px' }}>
              {[
                { icon: Users,         label: 'Total Records', value: analysis.total_records, color: '#3b82f6' },
                { icon: AlertTriangle, label: 'Flagged',        value: analysis.total_flagged, color: analysis.total_flagged > 0 ? '#ef4444' : '#10b981' },
                { icon: TrendingUp,    label: 'Anomaly Rate',  value: `${analysis.anomaly_rate_pct?.toFixed(1)}%`, color: analysis.anomaly_rate_pct > 10 ? '#ef4444' : analysis.anomaly_rate_pct > 3 ? '#f59e0b' : '#10b981' },
                { icon: Shield,        label: 'Risk Level',    value: analysis.risk_level, color: RISK_CONFIG[analysis.risk_level]?.color || '#6b7280' },
                { icon: Zap,           label: 'High Risk',     value: analysis.summary?.high_risk_count ?? 0, color: '#ef4444' },
              ].map((m, i) => {
                const Icon = m.icon;
                return (
                  <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                      <Icon size={14} color={m.color} />
                      <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{m.label}</span>
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: 800, color: m.color }}>{m.value}</div>
                  </div>
                );
              })}
            </div>

            {/* Anomaly type breakdown */}
            {analysis.summary?.anomaly_type_breakdown && Object.keys(analysis.summary.anomaly_type_breakdown).length > 0 && (
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '24px', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'white', marginBottom: '14px' }}>Anomaly Type Breakdown</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {Object.entries(analysis.summary.anomaly_type_breakdown).map(([type, count]: [string, any]) => {
                    const cfg = ANOMALY_COLORS[type] || { color: '#6b7280', bg: 'rgba(107,114,128,0.12)', label: type };
                    return (
                      <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', background: cfg.bg, border: `1px solid ${cfg.color}35`, borderRadius: '12px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: cfg.color }}>{count}×</span>
                        <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>{cfg.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {analysis.summary?.recommendations?.length > 0 && (
              <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '20px', padding: '24px', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'white', marginBottom: '14px' }}>⚡ AI Recommendations</h3>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {analysis.summary.recommendations.map((r: string, i: number) => (
                    <li key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      <AlertTriangle size={14} color="#f59e0b" style={{ marginTop: '2px', flexShrink: 0 }} />
                      <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '14px', lineHeight: 1.6 }}>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Flagged records table */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'white' }}>
                  {analysis.anomalies?.length > 0
                    ? `🚨 ${analysis.anomalies.length} Flagged Record${analysis.anomalies.length > 1 ? 's' : ''}`
                    : '✅ No Anomalies Detected'}
                </h3>
                {analysis.model_used && (
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>{analysis.model_used}</span>
                )}
              </div>

              {analysis.anomalies?.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <CheckCircle size={40} color="#10b981" style={{ margin: '0 auto 12px' }} />
                  <p style={{ color: '#34d399', fontWeight: 600, fontSize: '16px' }}>All records passed — payroll looks clean!</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {analysis.anomalies.map((a: any, i: number) => {
                    const isOpen = expanded === i;
                    const riskCfg = RISK_CONFIG[a.risk_level] || RISK_CONFIG.Medium;
                    return (
                      <div
                        key={i}
                        onClick={() => setExpanded(isOpen ? null : i)}
                        style={{
                          background: isOpen ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${isOpen ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.08)'}`,
                          borderRadius: '14px', padding: '16px 20px', cursor: 'pointer', transition: 'all 0.2s',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: riskCfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <AlertTriangle size={16} color={riskCfg.color} />
                            </div>
                            <div>
                              <div style={{ fontSize: '14px', fontWeight: 700, color: 'white', marginBottom: '2px' }}>{a.employee_id}</div>
                              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{a.job_role || '—'} · {a.department || 'No Department'}</div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: 'white' }}>${(a.monthly_income * 12).toLocaleString()}/yr</div>
                            <div style={{ padding: '4px 12px', borderRadius: '20px', background: riskCfg.bg, border: `1px solid ${riskCfg.color}40`, fontSize: '12px', color: riskCfg.color, fontWeight: 700 }}>
                              {a.risk_level} Risk
                            </div>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                              {a.flags?.map((f: any, fi: number) => {
                                const cfg = ANOMALY_COLORS[f.type] || { color: '#6b7280', bg: 'rgba(107,114,128,0.12)', label: f.type };
                                return <span key={fi} style={{ fontSize: '10px', fontWeight: 600, padding: '3px 8px', borderRadius: '8px', background: cfg.bg, color: cfg.color, whiteSpace: 'nowrap' }}>{cfg.label}</span>;
                              })}
                            </div>
                            {isOpen ? <ChevronUp size={16} color="rgba(255,255,255,0.4)" /> : <ChevronDown size={16} color="rgba(255,255,255,0.4)" />}
                          </div>
                        </div>

                        {isOpen && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                            style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                            {a.flags?.map((f: any, fi: number) => {
                              const cfg = ANOMALY_COLORS[f.type] || { color: '#6b7280', label: f.type };
                              return (
                                <div key={fi} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '10px 14px', marginBottom: '6px', background: `${cfg.color}08`, borderRadius: '10px', border: `1px solid ${cfg.color}20` }}>
                                  <AlertTriangle size={13} color={cfg.color} style={{ marginTop: '2px', flexShrink: 0 }} />
                                  <div>
                                    <div style={{ fontSize: '12px', fontWeight: 700, color: cfg.color, marginBottom: '2px' }}>{cfg.label}</div>
                                    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>{f.detail}</div>
                                  </div>
                                </div>
                              );
                            })}
                            <div style={{ marginTop: '8px', fontSize: '12px', color: 'rgba(255,255,255,0.25)' }}>
                              Record index: #{a.record_index} · Monthly income: ${a.monthly_income?.toLocaleString()}
                            </div>
                          </motion.div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {analysis.data_source && (
              <div style={{ marginTop: '14px', padding: '10px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)' }}>
                  📊 {analysis.data_source} · Company: {result?.company}
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
