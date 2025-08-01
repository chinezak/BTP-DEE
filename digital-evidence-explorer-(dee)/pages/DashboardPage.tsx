import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCases } from '../context/CaseContext';
import { Case } from '../types';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { ICONS } from '../constants';

const CaseCard: React.FC<{ caseData: Case }> = ({ caseData }) => (
  <Link to={`/case/${caseData.id}`} className="block bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow duration-200">
    <div className="flex items-start justify-between">
      <div>
        <h3 className="text-lg font-semibold text-btp-blue">{caseData.name}</h3>
        <p className="text-sm text-btp-gray-500">
          Created: {caseData.createdAt.toLocaleDateString()}
        </p>
      </div>
      <div className="text-btp-light-blue">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
            {ICONS.case}
        </svg>
      </div>
    </div>
    <div className="mt-4">
      <p className="text-sm font-medium text-btp-gray-700">
        {caseData.evidence.length} evidence file(s)
      </p>
    </div>
  </Link>
);


const DashboardPage: React.FC = () => {
  const { cases, addCase } = useCases();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCaseName, setNewCaseName] = useState('');

  const handleCreateCase = () => {
    if (newCaseName.trim()) {
      const newCase = addCase(newCaseName.trim());
      setIsModalOpen(false);
      setNewCaseName('');
      navigate(`/case/${newCase.id}`);
    }
  };

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-btp-gray-800">Case Dashboard</h2>
        <Button onClick={() => setIsModalOpen(true)}>Create New Case</Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cases.length > 0 ? (
            cases.map(caseData => (
              <CaseCard key={caseData.id} caseData={caseData} />
            ))
        ) : (
            <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-16 bg-white rounded-lg shadow">
                <h3 className="text-xl font-semibold text-btp-gray-700">No cases found.</h3>
                <p className="mt-2 text-btp-gray-500">Get started by creating a new case.</p>
            </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Case">
        <div className="space-y-4">
            <div>
                <label htmlFor="caseName" className="block text-sm font-medium text-btp-gray-700">
                    Case Name
                </label>
                <input
                    type="text"
                    id="caseName"
                    value={newCaseName}
                    onChange={(e) => setNewCaseName(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-btp-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-btp-light-blue focus:border-btp-light-blue"
                    placeholder="e.g., Case-452-Paddington-Vandalism"
                />
                 <p className="mt-2 text-xs text-btp-gray-500">A unique GCS bucket will be created with this name.</p>
            </div>
            <div className="flex justify-end space-x-2">
                <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateCase} disabled={!newCaseName.trim()}>Create</Button>
            </div>
        </div>
      </Modal>
    </div>
  );
};

export default DashboardPage;