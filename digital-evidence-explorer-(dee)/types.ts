
export enum Role {
  INVESTIGATOR = 'Investigator',
  ADMIN = 'Admin',
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export enum AnalysisStatus {
  NOT_STARTED = 'Not Started',
  PENDING = 'Pending Analysis',
  ANALYZING = 'Analyzing',
  COMPLETED = 'Completed',
  FAILED = 'Failed',
}

export interface EvidenceFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string; // Simulates local object URL
  uploadedAt: Date;
  status: AnalysisStatus;
  analysisResult?: AnalysisResult;
  file?: File; // To hold the actual file object for processing
}

export interface Case {
  id: string;
  name: string;
  createdAt: Date;
  bucketName: string; // Simulates GCS bucket name
  evidence: EvidenceFile[];
}

// Represents the structured data stored in BigQuery after Gemini analysis
export interface AnalysisResult {
  summary: string;
  fileId: string;
  entities?: Array<{ type: string; value: string; confidence: number; location?: string }>;
  transcription?: string;
  objects?: Array<{ name: string; confidence: number; timestamp?: string }>;
  ocrText?: string;
}
