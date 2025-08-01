
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useCases } from '../context/CaseContext';
import { EvidenceFile, AnalysisStatus, AnalysisResult } from '../types';
import Button from '../components/Button';
import FileIcon from '../components/FileIcon';
import Spinner from '../components/Spinner';
import Modal from '../components/Modal';
import { analyzeFiles, translateSearchQuery } from '../services/geminiService';

const StatusBadge: React.FC<{ status: AnalysisStatus }> = ({ status }) => {
    const colorClasses = {
        [AnalysisStatus.NOT_STARTED]: 'bg-gray-200 text-gray-800',
        [AnalysisStatus.PENDING]: 'bg-yellow-200 text-yellow-800 animate-pulse',
        [AnalysisStatus.ANALYZING]: 'bg-blue-200 text-blue-800',
        [AnalysisStatus.COMPLETED]: 'bg-green-200 text-green-800',
        [AnalysisStatus.FAILED]: 'bg-red-200 text-red-800',
    };
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${colorClasses[status]}`}>{status}</span>;
}

const EvidenceRow: React.FC<{ evidence: EvidenceFile, onSelect: (id: string) => void, isSelected: boolean, onRowClick: (evidence: EvidenceFile) => void, isHighlighted: boolean }> = ({ evidence, onSelect, isSelected, onRowClick, isHighlighted }) => {
    const isClickable = evidence.status === AnalysisStatus.COMPLETED;
    return (
        <tr 
            className={`border-b border-btp-gray-200 transition-colors ${isHighlighted ? 'bg-btp-gold bg-opacity-20' : 'hover:bg-btp-gray-50'} ${isClickable ? 'cursor-pointer' : ''}`}
            onClick={() => isClickable && onRowClick(evidence)}
        >
            <td className="p-3" onClick={e => e.stopPropagation()}>
                <input type="checkbox" checked={isSelected} onChange={() => onSelect(evidence.id)} className="h-4 w-4 rounded border-gray-300 text-btp-light-blue focus:ring-btp-light-blue" />
            </td>
            <td className="p-3">
                <div className="flex items-center">
                    <FileIcon fileType={evidence.type} className="w-6 h-6 mr-3 text-btp-light-blue" />
                    <span className="font-medium text-btp-gray-800">{evidence.name}</span>
                </div>
            </td>
            <td className="p-3 text-sm text-btp-gray-600">{(evidence.size / 1024 / 1024).toFixed(2)} MB</td>
            <td className="p-3 text-sm text-btp-gray-600">{evidence.uploadedAt.toLocaleDateString()}</td>
            <td className="p-3"><StatusBadge status={evidence.status} /></td>
        </tr>
    );
};

const AnalysisResultCard: React.FC<{ result: AnalysisResult; fileName: string }> = ({ result, fileName }) => (
    <div className="bg-white p-4 rounded-lg shadow border border-btp-gray-200">
        <h4 className="font-bold text-btp-blue">{fileName}</h4>
        <p className="mt-2 text-sm text-btp-gray-700">{result.summary}</p>
        {result.objects && (
            <div className="mt-2">
                <strong className="text-xs font-semibold">Objects Detected:</strong>
                <div className="flex flex-wrap gap-1 mt-1">
                    {result.objects.map((obj, i) => <span key={i} className="text-xs bg-btp-gray-200 px-2 py-1 rounded">{obj.name} {obj.timestamp && `(${obj.timestamp})`}</span>)}
                </div>
            </div>
        )}
        {result.entities && (
            <div className="mt-2">
                <strong className="text-xs font-semibold">Key Entities:</strong>
                <div className="flex flex-wrap gap-1 mt-1">
                    {result.entities.map((ent, i) => <span key={i} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">{ent.value} {ent.location && `(${ent.location})`}</span>)}
                </div>
            </div>
        )}
    </div>
);


const CaseViewPage: React.FC = () => {
    const { caseId } = useParams<{ caseId: string }>();
    const { getCaseById, addEvidenceToCase, updateEvidenceInCase } = useCases();
    
    const [selectedEvidence, setSelectedEvidence] = useState<string[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<AnalysisResult[]>([]);
    const [searchResultIds, setSearchResultIds] = useState<string[]>([]);
    const [selectedEvidenceForSummary, setSelectedEvidenceForSummary] = useState<EvidenceFile | null>(null);
    
    const [isCostModalOpen, setIsCostModalOpen] = useState(false);
    const [analysisCost, setAnalysisCost] = useState(0);

    const currentCase = useMemo(() => caseId ? getCaseById(caseId) : undefined, [caseId, getCaseById]);

    // Reset search results when case changes
    useEffect(() => {
        setSearchQuery('');
        setSearchResults([]);
        setSearchResultIds([]);
    }, [caseId]);
    
    const calculateAnalysisCost = (files: EvidenceFile[]): number => {
        let totalCost = 0;
        // Note: These are example prices and not official Google Cloud pricing.
        const COST_PER_IMAGE = 0.0025;
        const COST_PER_MB_VIDEO = 0.02; // Rough estimate for video processing
        const COST_PER_MB_DOC = 0.02;   // Rough estimate for documents ($0.002 per 100KB)
    
        files.forEach(file => {
            const sizeMB = file.size / 1024 / 1024;
            if (file.type.startsWith('image/')) {
                totalCost += COST_PER_IMAGE;
            } else if (file.type.startsWith('video/')) {
                totalCost += sizeMB * COST_PER_MB_VIDEO;
            } else if (file.type === 'application/pdf' || file.type.includes('document')) {
                totalCost += sizeMB * COST_PER_MB_DOC;
            } else {
                // A fallback for unknown/other file types
                totalCost += sizeMB * 0.01; 
            }
        });
        return totalCost;
    }

    const handleFileSelect = (id: string) => {
        setSelectedEvidence(prev => prev.includes(id) ? prev.filter(eId => eId !== id) : [...prev, id]);
    };
    
    const handleRowClick = (evidence: EvidenceFile) => {
        if (evidence.status === AnalysisStatus.COMPLETED && evidence.analysisResult) {
            setSelectedEvidenceForSummary(evidence);
        }
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && currentCase) {
            addEvidenceToCase(currentCase.id, Array.from(event.target.files));
        }
    };

    const handleAnalyzeClick = () => {
        if (!currentCase || isAnalyzing) return;
        const toAnalyze = currentCase.evidence.filter(e => selectedEvidence.includes(e.id) && e.status === AnalysisStatus.NOT_STARTED);
        if (toAnalyze.length > 0) {
            const cost = calculateAnalysisCost(toAnalyze);
            setAnalysisCost(cost);
            setIsCostModalOpen(true);
        }
    };

    const executeAnalysis = async () => {
        if (!currentCase) return;
        setIsCostModalOpen(false);
        setIsAnalyzing(true);

        const toAnalyzeIds = new Set(selectedEvidence.filter(id => {
            const ev = currentCase.evidence.find(e => e.id === id);
            return ev && ev.status === AnalysisStatus.NOT_STARTED;
        }));
        
        // Set status to PENDING
        toAnalyzeIds.forEach(id => {
            const evidence = currentCase.evidence.find(e => e.id === id);
            if(evidence) updateEvidenceInCase(currentCase.id, { ...evidence, status: AnalysisStatus.PENDING });
        });
        await new Promise(res => setTimeout(res, 50)); // Allow UI to update

        // Set status to ANALYZING
        toAnalyzeIds.forEach(id => {
            const evidence = currentCase.evidence.find(e => e.id === id);
            if(evidence) updateEvidenceInCase(currentCase.id, { ...evidence, status: AnalysisStatus.ANALYZING });
        });

        const filesToAnalyze = currentCase.evidence.filter(e => toAnalyzeIds.has(e.id));
        const analysisResults = await analyzeFiles(filesToAnalyze);

        analysisResults.forEach(({ fileId, result, error }) => {
            const evidence = currentCase.evidence.find(e => e.id === fileId);
            if (evidence) {
                if (result) {
                    updateEvidenceInCase(currentCase.id, { ...evidence, status: AnalysisStatus.COMPLETED, analysisResult: result });
                } else {
                    console.error(`Analysis failed for ${evidence.name}: ${error}`);
                    updateEvidenceInCase(currentCase.id, { ...evidence, status: AnalysisStatus.FAILED });
                }
            }
        });
        
        setIsAnalyzing(false);
        setSelectedEvidence([]);
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim() || !currentCase) return;

        setIsSearching(true);
        setSearchResults([]);
        setSearchResultIds([]);

        const { keywords } = await translateSearchQuery(searchQuery);
        if (keywords.length === 0) {
            setIsSearching(false);
            return;
        }
        
        const completedEvidence = currentCase.evidence.filter(e => e.status === AnalysisStatus.COMPLETED && e.analysisResult);

        const matchingEvidence = completedEvidence.filter(({ analysisResult }) => {
            if (!analysisResult) return false;
            
            const searchText = JSON.stringify(analysisResult).toLowerCase();
            return keywords.every(keyword => searchText.includes(keyword.toLowerCase()));
        });

        setSearchResults(matchingEvidence.map(e => e.analysisResult!));
        setSearchResultIds(matchingEvidence.map(e => e.id));
        setIsSearching(false);
    };


    if (!currentCase) {
        return <Navigate to="/dashboard" />;
    }

    const unanalyzedSelected = useMemo(() => {
        return selectedEvidence.some(id => {
            const ev = currentCase.evidence.find(e => e.id === id);
            return ev && ev.status === AnalysisStatus.NOT_STARTED;
        });
    }, [selectedEvidence, currentCase.evidence]);

    return (
        <div>
            <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
                <h2 className="text-2xl font-bold text-btp-blue">{currentCase.name}</h2>
                <p className="text-sm text-btp-gray-600">GCS Bucket: <code className="bg-btp-gray-200 px-1 rounded">{currentCase.bucketName}</code></p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-btp-gray-800">Evidence Files</h3>
                            <div className="flex items-center space-x-2">
                                <Button onClick={handleAnalyzeClick} disabled={!unanalyzedSelected || isAnalyzing}>
                                    {isAnalyzing ? <Spinner size="sm" /> : 'Analyze Selected'}
                                </Button>
                                <Button variant="secondary" onClick={() => document.getElementById('file-upload')?.click()}>
                                    Upload Evidence
                                </Button>
                                <input type="file" id="file-upload" multiple className="hidden" onChange={handleFileUpload} accept=".mp4,.mov,.jpg,.jpeg,.png,.pdf,.docx" />
                            </div>
                        </div>

                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b-2 border-btp-gray-300">
                                    <th className="p-3 w-12"><input type="checkbox" disabled={currentCase.evidence.length === 0} onChange={(e) => setSelectedEvidence(e.target.checked ? currentCase.evidence.map(ev => ev.id) : [])} /></th>
                                    <th className="p-3">Name</th>
                                    <th className="p-3">Size</th>
                                    <th className="p-3">Uploaded</th>
                                    <th className="p-3">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentCase.evidence.map(e => <EvidenceRow key={e.id} evidence={e} onSelect={handleFileSelect} isSelected={selectedEvidence.includes(e.id)} onRowClick={handleRowClick} isHighlighted={searchResultIds.includes(e.id)} />)}
                            </tbody>
                        </table>
                        {currentCase.evidence.length === 0 && <p className="text-center py-8 text-btp-gray-500">No evidence uploaded yet.</p>}
                    </div>
                </div>

                <div>
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                        <h3 className="text-lg font-semibold text-btp-gray-800 mb-4">Intelligent Search</h3>
                        <form onSubmit={handleSearch}>
                            <textarea
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    if(e.target.value.trim() === '') {
                                        setSearchResults([]);
                                        setSearchResultIds([]);
                                    }
                                }}
                                placeholder="Natural language query, e.g., 'Show me anyone wearing a blue bag'"
                                className="w-full p-2 border border-btp-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-btp-light-blue focus:border-btp-light-blue"
                                rows={3}
                            />
                            <Button type="submit" className="w-full mt-2" disabled={isSearching || !searchQuery.trim()}>
                                {isSearching ? <Spinner size="sm" /> : 'Search Evidence'}
                            </Button>
                        </form>

                        <div className="mt-6 space-y-4">
                            <h4 className="font-semibold text-btp-gray-700">Search Results</h4>
                            {isSearching && <div className="flex justify-center p-4"><Spinner /></div>}
                            {!isSearching && searchResults.length === 0 && <p className="text-sm text-btp-gray-500 text-center py-4">No results found. Try analyzing more files or refining your search.</p>}
                            {searchResults.map(result => {
                                const file = currentCase.evidence.find(e => e.id === result.fileId);
                                return file ? <AnalysisResultCard key={result.fileId} result={result} fileName={file.name} /> : null;
                            })}
                        </div>
                    </div>
                </div>
            </div>
            
            <Modal isOpen={!!selectedEvidenceForSummary} onClose={() => setSelectedEvidenceForSummary(null)} title={`Analysis: ${selectedEvidenceForSummary?.name}`}>
                 {selectedEvidenceForSummary?.analysisResult && (
                    <div>
                        <p className="text-sm text-btp-gray-700 mb-4">{selectedEvidenceForSummary.analysisResult.summary}</p>
                        
                        {selectedEvidenceForSummary.analysisResult.objects && selectedEvidenceForSummary.analysisResult.objects.length > 0 && (
                            <div className="mt-4">
                                <strong className="text-sm font-semibold text-btp-gray-800">Objects Detected:</strong>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {selectedEvidenceForSummary.analysisResult.objects.map((obj, i) => <span key={i} className="text-xs bg-btp-gray-200 px-2 py-1 rounded-full">{obj.name} {obj.timestamp && `(${obj.timestamp})`}</span>)}
                                </div>
                            </div>
                        )}
                        {selectedEvidenceForSummary.analysisResult.entities && selectedEvidenceForSummary.analysisResult.entities.length > 0 && (
                            <div className="mt-4">
                                <strong className="text-sm font-semibold text-btp-gray-800">Key Entities:</strong>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {selectedEvidenceForSummary.analysisResult.entities.map((ent, i) => <span key={i} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{ent.value} {ent.location && `(${ent.location})`}</span>)}
                                </div>
                            </div>
                        )}
                        {selectedEvidenceForSummary.analysisResult.ocrText && (
                            <div className="mt-4">
                                <strong className="text-sm font-semibold text-btp-gray-800">Extracted Text (OCR):</strong>
                                <p className="text-sm text-btp-gray-600 bg-btp-gray-100 p-2 mt-2 rounded border border-btp-gray-200 whitespace-pre-wrap">{selectedEvidenceForSummary.analysisResult.ocrText}</p>
                            </div>
                        )}
                        {selectedEvidenceForSummary.analysisResult.transcription && (
                            <div className="mt-4">
                                <strong className="text-sm font-semibold text-btp-gray-800">Transcription:</strong>
                                <p className="text-sm text-btp-gray-600 bg-btp-gray-100 p-2 mt-2 rounded border border-btp-gray-200 whitespace-pre-wrap">{selectedEvidenceForSummary.analysisResult.transcription}</p>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
            
            <Modal isOpen={isCostModalOpen} onClose={() => setIsCostModalOpen(false)} title="Confirm Analysis & Estimate Cost">
                 <div>
                    <p className="text-sm text-btp-gray-700 mb-4">
                        You are about to analyze {selectedEvidence.filter(id => currentCase?.evidence.find(e => e.id === id)?.status === AnalysisStatus.NOT_STARTED).length} file(s).
                    </p>
                    <div className="bg-btp-gray-100 p-3 rounded-lg mb-4 border border-btp-gray-200">
                        <p className="font-semibold text-btp-blue">Estimated Cost:</p>
                        <p className="text-2xl font-bold text-btp-blue">${analysisCost.toFixed(4)}</p>
                        <p className="text-xs text-btp-gray-500 mt-1">Note: This is an example price for demonstration purposes only. Actual costs may vary based on file content and final pricing.</p>
                    </div>
                     <div className="flex justify-end space-x-2">
                        <Button variant="secondary" onClick={() => setIsCostModalOpen(false)}>Cancel</Button>
                        <Button onClick={executeAnalysis}>Confirm & Analyze</Button>
                    </div>
                </div>
            </Modal>

        </div>
    );
};

export default CaseViewPage;
