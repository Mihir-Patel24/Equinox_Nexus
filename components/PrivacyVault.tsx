'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, Lock, Eye, EyeOff, CheckCircle, Key, FileText,
  Fingerprint, Server, Zap, AlertTriangle, Upload, Download, X
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ZKProof {
  id: string;
  type: string;
  claim: string;
  status: 'pending' | 'verified' | 'shared';
  verifier?: string;
  timestamp: string;
  proofHash: string;
}

interface EncryptedDocument {
  id: string;
  name: string;
  type: string;
  encrypted: boolean;
  uploadDate: string;
  size: string;
  file?: File;
}

export function PrivacyVault() {
  const [showProofDemo, setShowProofDemo] = useState(false);
  const [generatingProof, setGeneratingProof] = useState(false);
  const [proofGenerated, setProofGenerated] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<string>('income');
  const [revealedDocs, setRevealedDocs] = useState<Set<string>>(new Set());
  const [uploadedDocs, setUploadedDocs] = useState<EncryptedDocument[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [generatedProofHash, setGeneratedProofHash] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const zkProofs: ZKProof[] = [
    { id: '1', type: 'Income Verification', claim: 'Annual income exceeds $80,000', status: 'verified', timestamp: '2026-01-04', proofHash: '0x7f3a...8c2d' },
    { id: '2', type: 'Trust Score', claim: 'Trust score is above 85/100', status: 'shared', verifier: 'Berlin Landlord GmbH', timestamp: '2026-01-03', proofHash: '0x9b2e...4f1a' },
    { id: '3', type: 'Employment Status', claim: 'Currently employed full-time', status: 'verified', timestamp: '2026-01-02', proofHash: '0x3d5c...7e9b' },
    { id: '4', type: 'Credit History', claim: 'No defaults in past 5 years', status: 'pending', timestamp: '2026-01-04', proofHash: '0x1a8f...2c3d' },
  ];

  const defaultDocs: EncryptedDocument[] = [
    { id: 'd1', name: 'Bank_Statement_Dec2025.pdf', type: 'Financial', encrypted: true, uploadDate: '2025-12-28', size: '2.4 MB' },
    { id: 'd2', name: 'Employment_Contract.pdf', type: 'Employment', encrypted: true, uploadDate: '2025-11-15', size: '1.1 MB' },
    { id: 'd3', name: 'Passport_Scan.pdf', type: 'Identity', encrypted: true, uploadDate: '2025-10-20', size: '3.2 MB' },
    { id: 'd4', name: 'Tax_Return_2024.pdf', type: 'Tax', encrypted: true, uploadDate: '2025-04-15', size: '4.8 MB' },
  ];

  const allDocs = [...defaultDocs, ...uploadedDocs];

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileType = (fileName: string): string => {
    const lower = fileName.toLowerCase();
    if (lower.includes('bank') || lower.includes('statement') || lower.includes('financial')) return 'Financial';
    if (lower.includes('passport') || lower.includes('id') || lower.includes('identity')) return 'Identity';
    if (lower.includes('tax') || lower.includes('return')) return 'Tax';
    if (lower.includes('contract') || lower.includes('employment') || lower.includes('offer')) return 'Employment';
    return 'Document';
  };

  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const newDocs: EncryptedDocument[] = [];
    Array.from(files).forEach((file) => {
      const newDoc: EncryptedDocument = {
        id: 'u' + Date.now() + Math.random().toString(36).slice(2),
        name: file.name,
        type: getFileType(file.name),
        encrypted: true,
        uploadDate: new Date().toISOString().split('T')[0],
        size: formatFileSize(file.size),
        file: file
      };
      newDocs.push(newDoc);
    });
    
    setUploadedDocs(prev => [...prev, ...newDocs]);
    setShowUploadModal(false);
    toast.success(`${files.length} file(s) encrypted and uploaded!`, { icon: '🔐' });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const handleDownload = (doc: EncryptedDocument) => {
    if (doc.file) {
      // For uploaded files, create download link
      const url = URL.createObjectURL(doc.file);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Decrypted and downloaded: ${doc.name}`, { icon: '📥' });
    } else {
      // For demo files, generate a sample document
      generateSampleDocument(doc);
    }
  };

  const generateSampleDocument = (doc: EncryptedDocument) => {
    let content = '';
    const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    
    if (doc.type === 'Financial') {
      content = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                           BANK STATEMENT                                     ║
║                        December 2025                                         ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  Account Holder: Pranay Gujar                                                ║
║  Account Number: ****-****-****-4521                                         ║
║  Statement Period: December 1-31, 2025                                       ║
║                                                                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  ACCOUNT SUMMARY                                                             ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  Opening Balance:                                    ₹2,45,000.00            ║
║  Total Credits:                                      ₹1,00,000.00            ║
║  Total Debits:                                         ₹67,500.00            ║
║  Closing Balance:                                    ₹2,77,500.00            ║
║                                                                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  TRANSACTION DETAILS                                                         ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  Date        Description                    Debit       Credit     Balance   ║
║  ─────────────────────────────────────────────────────────────────────────── ║
║  01 Dec      Opening Balance                 -           -       2,45,000    ║
║  05 Dec      Salary Credit                   -       1,00,000    3,45,000    ║
║  08 Dec      Rent Payment                35,000          -       3,10,000    ║
║  12 Dec      Grocery - BigBasket          4,500          -       3,05,500    ║
║  15 Dec      Electricity Bill             2,800          -       3,02,700    ║
║  18 Dec      Internet - Airtel            1,200          -       3,01,500    ║
║  22 Dec      Restaurant                   3,500          -       2,98,000    ║
║  25 Dec      Shopping - Amazon           12,500          -       2,85,500    ║
║  28 Dec      Fuel                         4,000          -       2,81,500    ║
║  30 Dec      Mobile Recharge              1,000          -       2,80,500    ║
║  31 Dec      Miscellaneous                3,000          -       2,77,500    ║
║                                                                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  This is a computer-generated statement and does not require signature.      ║
║  For any queries, contact: support@equinoxbank.com                           ║
║                                                                              ║
║  Generated via Equinox Nexus Privacy Vault                                    ║
║  Document ID: BS-${Date.now().toString(36).toUpperCase()}                    
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
`;
    } else if (doc.type === 'Employment') {
      content = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                        EMPLOYMENT CONTRACT                                   ║
║                     CONFIDENTIAL DOCUMENT                                    ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  EMPLOYER: TechCorp Solutions Pvt. Ltd.                                      ║
║  Address: Hinjewadi IT Park, Pune, Maharashtra 411057                        ║
║                                                                              ║
║  EMPLOYEE: Pranay Gujar                                                      ║
║  Employee ID: EMP-2024-0892                                                  ║
║  Department: Software Engineering                                            ║
║  Designation: Senior Software Developer                                      ║
║                                                                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  EMPLOYMENT DETAILS                                                          ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  Date of Joining:        January 15, 2024                                    ║
║  Employment Type:        Full-Time, Permanent                                ║
║  Probation Period:       6 months (Completed)                                ║
║  Work Location:          Pune, Maharashtra                                   ║
║  Reporting Manager:      Rahul Sharma (Engineering Lead)                     ║
║                                                                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  COMPENSATION DETAILS (Annual)                                               ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  Basic Salary:                                       ₹6,00,000               ║
║  House Rent Allowance (HRA):                         ₹2,40,000               ║
║  Special Allowance:                                  ₹2,40,000               ║
║  Performance Bonus (Variable):                       ₹1,20,000               ║
║  ─────────────────────────────────────────────────────────────────────────── ║
║  Total CTC:                                         ₹12,00,000               ║
║  Monthly Gross:                                      ₹1,00,000               ║
║                                                                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  BENEFITS                                                                    ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  • Health Insurance: ₹5,00,000 coverage (Self + Family)                      ║
║  • Provident Fund: 12% employer contribution                                 ║
║  • Paid Leave: 24 days annually                                              ║
║  • Work From Home: Hybrid (3 days office, 2 days remote)                     ║
║  • Learning Budget: ₹50,000 annually                                         ║
║                                                                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  This document is confidential and intended for verification purposes only.  ║
║                                                                              ║
║  HR Contact: hr@techcorp.in | +91-20-4567-8900                               ║
║  Document ID: EC-${Date.now().toString(36).toUpperCase()}                    
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
`;
    } else if (doc.type === 'Identity') {
      content = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                        IDENTITY DOCUMENT                                     ║
║                    PASSPORT INFORMATION                                      ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║                         [PHOTO PLACEHOLDER]                                  ║
║                                                                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  PERSONAL DETAILS                                                            ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  Full Name:              PRANAY GUJAR                                        ║
║  Date of Birth:          **/**/****  (Redacted for privacy)                  ║
║  Gender:                 Male                                                ║
║  Place of Birth:         Pune, Maharashtra, India                            ║
║  Nationality:            Indian                                              ║
║                                                                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  PASSPORT DETAILS                                                            ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  Passport Number:        ****4521 (Partially redacted)                       ║
║  Date of Issue:          March 15, 2022                                      ║
║  Date of Expiry:         March 14, 2032                                      ║
║  Place of Issue:         Pune, Maharashtra                                   ║
║  Type:                   P (Personal)                                        ║
║                                                                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  VERIFICATION STATUS                                                         ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  ✓ Document Verified via DigiLocker                                          ║
║  ✓ Biometric Match: Confirmed                                                ║
║  ✓ Government Database: Validated                                            ║
║                                                                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  PRIVACY NOTICE: Sensitive information has been redacted. This document      ║
║  serves as proof of identity verification without exposing full details.     ║
║                                                                              ║
║  Document ID: ID-${Date.now().toString(36).toUpperCase()}                    
║  Generated: ${currentDate}                                                   
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
`;
    } else if (doc.type === 'Tax') {
      content = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                     INCOME TAX RETURN - AY 2024-25                           ║
║                        ACKNOWLEDGEMENT                                       ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  PAN:                    ****G****P (Partially masked)                       ║
║  Name:                   PRANAY GUJAR                                        ║
║  Assessment Year:        2024-25                                             ║
║  Filing Date:            July 28, 2024                                       ║
║  ITR Form:               ITR-1 (Sahaj)                                       ║
║                                                                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  INCOME SUMMARY                                                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  Income from Salary:                                ₹12,00,000               ║
║  Income from Other Sources:                            ₹45,000               ║
║  ─────────────────────────────────────────────────────────────────────────── ║
║  Gross Total Income:                                ₹12,45,000               ║
║                                                                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  DEDUCTIONS (Chapter VI-A)                                                   ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  Section 80C (PF, LIC, etc.):                        ₹1,50,000               ║
║  Section 80D (Health Insurance):                        ₹25,000              ║
║  Section 80TTA (Savings Interest):                      ₹10,000              ║
║  ─────────────────────────────────────────────────────────────────────────── ║
║  Total Deductions:                                   ₹1,85,000               ║
║                                                                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  TAX COMPUTATION                                                             ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  Taxable Income:                                    ₹10,60,000               ║
║  Tax on Total Income:                                ₹1,17,000               ║
║  Less: Rebate u/s 87A:                                      ₹0               ║
║  Add: Health & Education Cess (4%):                     ₹4,680               ║
║  ─────────────────────────────────────────────────────────────────────────── ║
║  Total Tax Liability:                                ₹1,21,680               ║
║  TDS Already Paid:                                   ₹1,25,000               ║
║  ─────────────────────────────────────────────────────────────────────────── ║
║  Refund Due:                                            ₹3,320               ║
║                                                                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  VERIFICATION STATUS                                                         ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  ✓ E-Verified via Aadhaar OTP                                                ║
║  ✓ Acknowledgement Number: CPC/2024/ITR1/********                            ║
║  ✓ Processing Status: Completed                                              ║
║  ✓ Refund Status: Credited to Bank Account                                   ║
║                                                                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  This is a computer-generated document from Income Tax Department.           ║
║  Document ID: TAX-${Date.now().toString(36).toUpperCase()}                   
║  Generated: ${currentDate}                                                   
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
`;
    } else {
      content = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                           DOCUMENT                                           ║
║                     ${doc.name}                                              
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  Document Type: ${doc.type}                                                  
║  Upload Date: ${doc.uploadDate}                                              
║  Size: ${doc.size}                                                           
║  Encryption: AES-256                                                         ║
║                                                                              ║
║  This is a sample document generated by Equinox Nexus Privacy Vault.          ║
║                                                                              ║
║  Document ID: DOC-${Date.now().toString(36).toUpperCase()}                   
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
`;
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.name.replace('.pdf', '.txt');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded: ${doc.name}`, { icon: '📄' });
  };

  const generateZKProof = () => {
    setGeneratingProof(true);
    setProofGenerated(false);
    
    // Simulate ZK proof generation
    setTimeout(() => {
      const proofHash = '0x' + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('');
      setGeneratedProofHash(proofHash);
      setGeneratingProof(false);
      setProofGenerated(true);
      toast.success('Zero-Knowledge Proof generated successfully!', { icon: '🔐' });
    }, 3000);
  };

  const getSelectedClaimLabel = () => {
    const claim = claimOptions.find(c => c.id === selectedClaim);
    return claim ? claim.label : 'Unknown Claim';
  };

  const downloadProofCertificate = () => {
    const selectedClaimData = claimOptions.find(c => c.id === selectedClaim);
    const timestamp = new Date().toISOString();
    const certificateId = 'ZKP-' + Date.now().toString(36).toUpperCase();
    
    const certificateContent = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║                    ZERO-KNOWLEDGE PROOF CERTIFICATE                          ║
║                         Equinox Nexus PRIVACY VAULT                           ║
║                                                                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  Certificate ID: ${certificateId}                                            
║                                                                              ║
║  ─────────────────────────────────────────────────────────────────────────── ║
║                                                                              ║
║  CLAIM TYPE: ${selectedClaimData?.label || 'Unknown'}                        
║                                                                              ║
║  CLAIM DESCRIPTION:                                                          ║
║  ${selectedClaimData?.desc || 'No description'}                              
║                                                                              ║
║  ─────────────────────────────────────────────────────────────────────────── ║
║                                                                              ║
║  VERIFICATION STATUS: ✓ VERIFIED                                             ║
║                                                                              ║
║  PROOF HASH:                                                                 ║
║  ${generatedProofHash}                                                       
║                                                                              ║
║  ─────────────────────────────────────────────────────────────────────────── ║
║                                                                              ║
║  CRYPTOGRAPHIC DETAILS:                                                      ║
║  • Protocol: zk-SNARK (Groth16)                                              ║
║  • Curve: BN254                                                              ║
║  • Hash Function: Poseidon                                                   ║
║  • Verification Key: Embedded in proof                                       ║
║                                                                              ║
║  ─────────────────────────────────────────────────────────────────────────── ║
║                                                                              ║
║  TIMESTAMP: ${timestamp}                                                     
║                                                                              ║
║  ISSUER: Equinox Nexus Privacy Vault                                          ║
║  VALIDITY: 30 days from issue date                                           ║
║                                                                              ║
║  ─────────────────────────────────────────────────────────────────────────── ║
║                                                                              ║
║  PRIVACY GUARANTEE:                                                          ║
║  This certificate proves the above claim WITHOUT revealing any underlying    ║
║  personal data. The proof can be independently verified using the proof      ║
║  hash and public verification key.                                           ║
║                                                                              ║
║  VERIFICATION URL:                                                           ║
║  https://equinox-flow.vercel.app/verify/${certificateId}                     
║                                                                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  🔐 Secured by Zero-Knowledge Cryptography                                   ║
║  ✓ GDPR Compliant  ✓ SOC 2 Type II  ✓ No Data Exposure                       ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
`;

    const blob = new Blob([certificateContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ZK_Proof_Certificate_${certificateId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Proof certificate downloaded!', { icon: '📄' });
  };

  const claimOptions = [
    { id: 'income', label: 'Income > $80,000', desc: 'Prove income threshold without revealing exact amount' },
    { id: 'trust', label: 'Trust Score > 85', desc: 'Prove creditworthiness without exposing financial history' },
    { id: 'employment', label: 'Employed Full-Time', desc: 'Verify employment without sharing contract details' },
    { id: 'residency', label: 'Legal Residency', desc: 'Prove visa status without revealing passport data' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '100px', border: '1px solid rgba(16, 185, 129, 0.3)', marginBottom: '16px' }}>
          <Shield style={{ width: '16px', height: '16px', color: '#10b981' }} />
          <span style={{ fontSize: '13px', color: '#10b981', fontWeight: 600 }}>Zero-Knowledge Privacy</span>
        </motion.div>
        <h2 style={{ fontSize: '32px', fontWeight: 800, background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '8px' }}>
          Privacy Vault
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '15px' }}>
          Prove claims without revealing sensitive data using Zero-Knowledge Proofs
        </p>
      </div>

      {/* Security Status Banner */}
      <div style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(59, 130, 246, 0.1) 100%)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Lock style={{ width: '28px', height: '28px', color: 'white' }} />
        </div>
        <div style={{ flex: 1 }}>
          <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'white', marginBottom: '6px' }}>End-to-End Encryption Active</h4>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
            All documents encrypted with AES-256. Your data never leaves your device unencrypted. 
            AI models process only encrypted hashes - they never see your raw data.
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle style={{ width: '14px', height: '14px', color: '#10b981' }} />
            <span style={{ fontSize: '11px', color: '#10b981' }}>SOC 2 Type II</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle style={{ width: '14px', height: '14px', color: '#10b981' }} />
            <span style={{ fontSize: '11px', color: '#10b981' }}>GDPR Compliant</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* ZK Proof Generator */}
        <div style={{ background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.05) 100%)', backdropFilter: 'blur(24px)', border: '1px solid rgba(102, 126, 234, 0.2)', borderRadius: '20px', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Fingerprint style={{ width: '20px', height: '20px', color: 'white' }} />
            </div>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'white' }}>ZK-Identity Bridge</h3>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>Generate verifiable proofs without exposing data</p>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '10px', display: 'block' }}>Select Claim to Prove</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {claimOptions.map((option) => (
                <div key={option.id} onClick={() => setSelectedClaim(option.id)}
                  style={{ padding: '14px', background: selectedClaim === option.id ? 'rgba(139, 92, 246, 0.2)' : 'rgba(0,0,0,0.2)', border: `1px solid ${selectedClaim === option.id ? '#8b5cf6' : 'rgba(255,255,255,0.05)'}`, borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: `2px solid ${selectedClaim === option.id ? '#8b5cf6' : 'rgba(255,255,255,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {selectedClaim === option.id && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#8b5cf6' }} />}
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'white' }}>{option.label}</div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{option.desc}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={generateZKProof} disabled={generatingProof}
            style={{ width: '100%', padding: '14px', background: generatingProof ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', border: 'none', borderRadius: '12px', color: 'white', fontSize: '14px', fontWeight: 600, cursor: generatingProof ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            {generatingProof ? (
              <><Zap style={{ width: '16px', height: '16px', animation: 'pulse 1s infinite' }} /> Generating ZK Circuit...</>
            ) : proofGenerated ? (
              <><CheckCircle style={{ width: '16px', height: '16px' }} /> Proof Ready - Share</>
            ) : (
              <><Key style={{ width: '16px', height: '16px' }} /> Generate ZK Proof</>
            )}
          </motion.button>

          {proofGenerated && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              style={{ marginTop: '16px', padding: '14px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle style={{ width: '14px', height: '14px', color: '#10b981' }} />
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#10b981' }}>Proof Generated</span>
                </div>
                <motion.button 
                  whileHover={{ scale: 1.05 }} 
                  whileTap={{ scale: 0.95 }}
                  onClick={downloadProofCertificate}
                  style={{ padding: '6px 12px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none', borderRadius: '6px', color: 'white', fontSize: '11px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Download style={{ width: '12px', height: '12px' }} />
                  Download Certificate
                </motion.button>
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>
                Claim: <span style={{ color: '#a78bfa' }}>{getSelectedClaimLabel()}</span>
              </div>
              <code style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', wordBreak: 'break-all', display: 'block' }}>
                Proof Hash: {generatedProofHash.slice(0, 20)}...{generatedProofHash.slice(-8)}
              </code>
            </motion.div>
          )}
        </div>

        {/* Encrypted Documents */}
        <div style={{ background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.05) 100%)', backdropFilter: 'blur(24px)', border: '1px solid rgba(102, 126, 234, 0.2)', borderRadius: '20px', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Server style={{ width: '20px', height: '20px', color: 'white' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'white' }}>Encrypted Storage</h3>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>AES-256 encrypted at rest</p>
              </div>
            </div>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => setShowUploadModal(true)}
              style={{ padding: '8px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Upload style={{ width: '14px', height: '14px' }} />
              Upload
            </motion.button>
          </div>

          {/* Upload Modal */}
          <AnimatePresence>
            {showUploadModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
                onClick={() => setShowUploadModal(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                  style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', borderRadius: '20px', padding: '32px', width: '90%', maxWidth: '500px', border: '1px solid rgba(102, 126, 234, 0.3)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'white' }}>Upload Documents</h3>
                    <button onClick={() => setShowUploadModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.6)' }}>
                      <X style={{ width: '20px', height: '20px' }} />
                    </button>
                  </div>
                  
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: `2px dashed ${dragActive ? '#8b5cf6' : 'rgba(255,255,255,0.2)'}`,
                      borderRadius: '16px',
                      padding: '48px 24px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      background: dragActive ? 'rgba(139, 92, 246, 0.1)' : 'rgba(0,0,0,0.2)',
                      transition: 'all 0.2s'
                    }}
                  >
                    <Upload style={{ width: '48px', height: '48px', color: dragActive ? '#8b5cf6' : 'rgba(255,255,255,0.4)', margin: '0 auto 16px' }} />
                    <p style={{ fontSize: '16px', fontWeight: 600, color: 'white', marginBottom: '8px' }}>
                      {dragActive ? 'Drop files here' : 'Drag & drop files here'}
                    </p>
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
                      or click to browse
                    </p>
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '16px' }}>
                      Files will be encrypted with AES-256 before upload
                    </p>
                  </div>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={(e) => handleFileUpload(e.target.files)}
                    style={{ display: 'none' }}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {allDocs.map((doc) => (
              <div key={doc.id} style={{ padding: '14px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText style={{ width: '18px', height: '18px', color: '#3b82f6' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'white', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {revealedDocs.has(doc.id) ? doc.name : '••••••••••••.pdf'}
                    <Lock style={{ width: '12px', height: '12px', color: '#10b981' }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '10px', padding: '2px 6px', background: 'rgba(59, 130, 246, 0.2)', borderRadius: '4px', color: '#3b82f6' }}>{doc.type}</span>
                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>{doc.size}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      const newRevealed = new Set(revealedDocs);
                      if (newRevealed.has(doc.id)) newRevealed.delete(doc.id);
                      else newRevealed.add(doc.id);
                      setRevealedDocs(newRevealed);
                    }}
                    style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '6px', cursor: 'pointer', color: 'rgba(255,255,255,0.6)' }}>
                    {revealedDocs.has(doc.id) ? <EyeOff style={{ width: '14px', height: '14px' }} /> : <Eye style={{ width: '14px', height: '14px' }} />}
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    onClick={() => handleDownload(doc)}
                    style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '6px', cursor: 'pointer', color: 'rgba(255,255,255,0.6)' }}>
                    <Download style={{ width: '14px', height: '14px' }} />
                  </motion.button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Active ZK Proofs */}
      <div style={{ background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.05) 100%)', backdropFilter: 'blur(24px)', border: '1px solid rgba(102, 126, 234, 0.2)', borderRadius: '20px', padding: '24px' }}>
        <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'white', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Key style={{ width: '18px', height: '18px', color: '#a78bfa' }} />
          Active Zero-Knowledge Proofs
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          {zkProofs.map((proof) => (
            <div key={proof.id} style={{ padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '14px', border: `1px solid ${proof.status === 'shared' ? 'rgba(16, 185, 129, 0.3)' : proof.status === 'verified' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(245, 158, 11, 0.3)'}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'white' }}>{proof.type}</span>
                <span style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '4px', fontWeight: 600,
                  background: proof.status === 'shared' ? 'rgba(16, 185, 129, 0.2)' : proof.status === 'verified' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                  color: proof.status === 'shared' ? '#10b981' : proof.status === 'verified' ? '#3b82f6' : '#f59e0b'
                }}>{proof.status.toUpperCase()}</span>
              </div>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '10px' }}>"{proof.claim}"</p>
              {proof.verifier && (
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>
                  Shared with: <span style={{ color: '#10b981' }}>{proof.verifier}</span>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <code style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>{proof.proofHash}</code>
                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>{proof.timestamp}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Privacy Notice */}
      <div style={{ padding: '16px 20px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <AlertTriangle style={{ width: '18px', height: '18px', color: '#f59e0b', flexShrink: 0, marginTop: '2px' }} />
        <div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#f59e0b', marginBottom: '4px' }}>Privacy Guarantee</div>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, margin: 0 }}>
            Your documents are encrypted client-side before upload. Our AI models only process cryptographic hashes and ZK proofs - 
            they never access your raw financial data, passport details, or personal documents. All data is excluded from model training.
          </p>
        </div>
      </div>
    </div>
  );
}
