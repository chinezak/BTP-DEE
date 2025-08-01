
import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { Case, EvidenceFile, AnalysisStatus } from '../types';

interface CaseContextType {
  cases: Case[];
  getCaseById: (caseId: string) => Case | undefined;
  addCase: (caseName: string) => Case;
  addEvidenceToCase: (caseId: string, files: File[]) => void;
  updateEvidenceInCase: (caseId: string, updatedEvidence: EvidenceFile) => void;
}

const CaseContext = createContext<CaseContextType | undefined>(undefined);

export const CaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cases, setCases] = useState<Case[]>([]);

  const getCaseById = useCallback((caseId: string) => {
    return cases.find(c => c.id === caseId);
  }, [cases]);

  const addCase = (caseName: string): Case => {
    const slug = caseName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const newCase: Case = {
      id: 'case-' + Date.now(),
      name: caseName,
      createdAt: new Date(),
      bucketName: `btp-dee-${slug}-${Date.now()}`,
      evidence: [],
    };
    setCases(prevCases => [...prevCases, newCase]);
    return newCase;
  };

  const addEvidenceToCase = (caseId: string, files: File[]) => {
    const newEvidenceFiles: EvidenceFile[] = files.map((file, index) => ({
      id: `ev-${Date.now()}-${index}`,
      name: file.name,
      type: file.type,
      size: file.size,
      url: URL.createObjectURL(file), // Create local URL for display/access
      uploadedAt: new Date(),
      status: AnalysisStatus.NOT_STARTED,
      file: file, // Store the actual file object
    }));

    setCases(prevCases =>
      prevCases.map(c =>
        c.id === caseId ? { ...c, evidence: [...c.evidence, ...newEvidenceFiles] } : c
      )
    );
  };
  
  const updateEvidenceInCase = (caseId: string, updatedEvidence: EvidenceFile) => {
    setCases(prevCases =>
      prevCases.map(c => {
        if (c.id === caseId) {
          return {
            ...c,
            evidence: c.evidence.map(e =>
              e.id === updatedEvidence.id ? updatedEvidence : e
            ),
          };
        }
        return c;
      })
    );
  };


  return (
    <CaseContext.Provider value={{ cases, getCaseById, addCase, addEvidenceToCase, updateEvidenceInCase }}>
      {children}
    </CaseContext.Provider>
  );
};

export const useCases = (): CaseContextType => {
  const context = useContext(CaseContext);
  if (!context) {
    throw new Error('useCases must be used within a CaseProvider');
  }
  return context;
};
