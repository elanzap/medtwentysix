import React, { useState } from 'react';
import { Search, Printer, Plus, X, List } from 'lucide-react';
import type { Prescription, LabInvoice } from '../../types';
import { useDiagnosticTestStore } from '../../stores/diagnosticTestStore';
import { useLabInvoiceStore } from '../../stores/labInvoiceStore';
import { useGlobalSettingsStore } from '../../stores/globalSettingsStore';
import { LabInvoiceList } from './LabInvoiceList';

interface LabOrderInvoiceProps {
  prescriptions: Prescription[];
}

export const LabOrderInvoice: React.FC<LabOrderInvoiceProps> = ({ prescriptions }) => {
  console.log('Available Prescriptions:', prescriptions);

  const { tests } = useDiagnosticTestStore();
  const { addInvoice, invoices } = useLabInvoiceStore();

  const [view, setView] = useState<'list' | 'search' | 'create' | 'invoice'>('list');
  const [prescriptionId, setPrescriptionId] = useState('');
  const [discount, setDiscount] = useState(0);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [patientName, setPatientName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const resetForm = () => {
    setPrescriptionId('');
    setDiscount(0);
    setSelectedPrescription(null);
    setSelectedTests([]);
    setPatientName('');
    setSearchTerm('');
    setView('list');
  };

  const handleSearch = () => {
    if (!prescriptionId.trim()) {
      alert('Please enter a Prescription ID');
      return;
    }

    const prescription = prescriptions.find(p => 
      p.prescriptionId.toLowerCase() === prescriptionId.toLowerCase()
    );

    if (prescription && prescription.labTests && prescription.labTests.length > 0) {
      setSelectedPrescription(prescription);
      setView('invoice');
    } else {
      alert('No lab tests found for this prescription ID');
    }
  };

  const handleCreateManualOrder = () => {
    if (!patientName.trim()) {
      alert('Please enter patient name');
      return;
    }
    if (selectedTests.length === 0) {
      alert('Please select at least one test');
      return;
    }

    const manualPrescription: Prescription = {
      prescriptionId: 'M' + Date.now(),
      visitId: 'MV' + Date.now(),
      patientId: 'MP' + Date.now(),
      patientName: patientName.trim(),
      date: new Date().toISOString(),
      labTests: selectedTests
    };

    setSelectedPrescription(manualPrescription);
    setView('invoice');
    setSelectedTests([]);
    setPatientName('');
  };

  const handleTestSelect = (testName: string) => {
    if (!selectedTests.includes(testName)) {
      setSelectedTests(prev => [...prev, testName]);
    }
    setSearchTerm('');
    setIsDropdownOpen(false);
  };

  const getTestName = (test: string | { name: string } | any): string => {
    if (typeof test === 'string') return test;
    if (typeof test === 'object' && test && test.name) return test.name;
    return 'Unknown Test';
  };

  const handleTestRemove = (test: string | { name: string } | any) => {
    const testName = getTestName(test);
    setSelectedTests(prev => 
      prev.filter(t => getTestName(t) !== testName)
    );
  };

  const getTestPrice = (testName: string): number => {
    const test = tests.find(t => t.name === testName);
    return test?.price || 0;
  };

  const calculateTotal = (tests: string[]) => {
    return tests.reduce((total, test) => total + getTestPrice(test), 0);
  };

  const calculateDiscountedTotal = (tests: string[], discountPercentage: number) => {
    const total = calculateTotal(tests);
    const discountAmount = (total * discountPercentage) / 100;
    return total - discountAmount;
  };

  const handleSave = () => {
    if (!selectedPrescription) return;

    // Get global settings
    const { labName, labLogo } = useGlobalSettingsStore.getState();

    const invoice: LabInvoice = {
      id: `INV${Date.now()}`,
      date: new Date().toISOString(),
      prescriptionId: selectedPrescription.prescriptionId,
      patientName: selectedPrescription.patientName,
      tests: selectedPrescription.labTests || [],
      subtotal: calculateTotal(selectedPrescription.labTests || []),
      discount,
      total: calculateDiscountedTotal(selectedPrescription.labTests || [], discount),
      status: 'saved',
      // Add lab details to invoice
      labName,
      labLogo
    };

    addInvoice(invoice);
    resetForm();
  };

  const handlePrint = () => {
    if (!selectedPrescription) return;

    // Get global settings
    const { labName, labLogo } = useGlobalSettingsStore.getState();

    const invoice: LabInvoice = {
      id: `INV${Date.now()}`,
      date: new Date().toISOString(),
      prescriptionId: selectedPrescription.prescriptionId,
      patientName: selectedPrescription.patientName,
      tests: selectedPrescription.labTests || [],
      subtotal: calculateTotal(selectedPrescription.labTests || []),
      discount,
      total: calculateDiscountedTotal(selectedPrescription.labTests || [], discount),
      status: 'printed',
      // Add lab details to invoice
      labName,
      labLogo
    };

    addInvoice(invoice);
    
    // Add a small delay to ensure DOM is ready
    setTimeout(() => {
      // Add print-specific class to body
      document.body.classList.add('print-invoice');
      
      // Trigger print
      window.print();
      
      // Remove print-specific class after printing
      document.body.classList.remove('print-invoice');
    }, 100);
  };

  const getLabTestNames = (prescription: Prescription): string[] => {
    if (!prescription.labTests) return [];
    return prescription.labTests.map(test => 
      typeof test === 'string' ? test : 
      typeof test === 'object' && test.name ? test.name : 
      ''
    ).filter(name => name.trim() !== '');
  };

  const handleViewInvoice = (invoice: LabInvoice) => {
    console.log('Available Prescriptions:', prescriptions);
    console.log('Invoice to View:', invoice);

    // Log detailed prescription information for debugging
    prescriptions.forEach((p, index) => {
      console.log(`Prescription ${index + 1}:`, {
        prescriptionId: p.prescriptionId,
        patientName: p.patientName,
        date: p.date
      });
    });

    // Attempt to match prescription using multiple criteria
    const matchedPrescription = prescriptions.find(p => {
      const matchesPrescriptionId = p.prescriptionId === invoice.prescriptionId;
      const matchesPatientName = p.patientName.toLowerCase() === invoice.patientName.toLowerCase();
      
      console.log(`Checking Prescription:`, {
        prescriptionId: p.prescriptionId,
        patientName: p.patientName,
        matchesPrescriptionId,
        matchesPatientName
      });

      return matchesPrescriptionId || matchesPatientName;
    });

    console.log('Matched Prescription:', matchedPrescription);

    if (matchedPrescription) {
      // Safely extract lab test names
      const labTestNames = matchedPrescription.labTests 
        ? matchedPrescription.labTests.map(test => 
            typeof test === 'string' ? test : 
            typeof test === 'object' && test.name ? test.name : 
            ''
          ).filter(name => name.trim() !== '')
        : [];

      setSelectedPrescription(matchedPrescription);
      setSelectedTests(invoice.tests || labTestNames || []);
      setDiscount(invoice.discount || 0);
      setPatientName(matchedPrescription.patientName);
      setView('invoice');
    } else {
      // Fallback: create a temporary prescription if no match found
      const tempPrescription: Prescription = {
        prescriptionId: invoice.prescriptionId,
        patientName: invoice.patientName,
        date: invoice.date,
        labTests: invoice.tests.map(testName => ({ name: testName })),
        status: 'completed'
      };

      console.warn('No exact prescription match. Creating temporary prescription.');
      setSelectedPrescription(tempPrescription);
      setSelectedTests(invoice.tests || []);
      setDiscount(invoice.discount || 0);
      setPatientName(invoice.patientName);
      setView('invoice');
    }
  };

  const filteredTests = tests.filter(test => 
    test.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !selectedTests.includes(test.name)
  );

  const renderInvoice = () => {
    // Get global settings
    const { labName, labLogo } = useGlobalSettingsStore.getState();

    if (!selectedPrescription) return null;

    return (
      <div className="bg-white rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            {labLogo && (
              <img 
                src={labLogo} 
                alt={`${labName} Logo`} 
                className="h-16 w-16 object-contain rounded-lg"
              />
            )}
            <h2 className="text-xl font-bold">{labName || 'Lab Order Invoice'}</h2>
          </div>
          <div className="flex space-x-2 print:hidden">
            <button
              onClick={handleSave}
              className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Save
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center px-3 py-1 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Print
            </button>
          </div>
        </div>

        {/* Patient Details */}
        <div className="mb-6">
          <p className="text-sm">
            <strong>Prescription ID:</strong> {selectedPrescription.prescriptionId}
          </p>
          <p className="text-sm">
            <strong>Patient Name:</strong> {selectedPrescription.patientName}
          </p>
          <p className="text-sm">
            <strong>Date:</strong> {new Date(selectedPrescription.date).toLocaleDateString()}
          </p>
        </div>

        {/* Discount Input */}
        <div className="mb-4 flex items-center justify-end space-x-4 print:hidden">
          <label className="text-sm font-medium text-gray-700">
            Discount (%)
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={discount}
            onChange={(e) => setDiscount(Number(e.target.value))}
            className="w-24 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        {/* Lab Tests */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Lab Tests</h3>
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border p-2 text-left text-sm">Test Name</th>
                <th className="border p-2 text-right text-sm">Price (₹)</th>
              </tr>
            </thead>
            <tbody>
              {selectedPrescription.labTests?.map((test, index) => (
                <tr key={index}>
                  <td className="border p-2 text-sm">{getTestName(test)}</td>
                  <td className="border p-2 text-right text-sm">
                    {getTestPrice(getTestName(test)).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="border-t pt-4">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>₹{calculateTotal(selectedPrescription.labTests || []).toFixed(2)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-sm">
              <span>Discount ({discount}%)</span>
              <span className="text-red-600">
                -₹{((calculateTotal(selectedPrescription.labTests || []) * discount) / 100).toFixed(2)}
              </span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold mt-2">
            <span>Total</span>
            <span>₹{calculateDiscountedTotal(selectedPrescription.labTests || [], discount).toFixed(2)}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Navigation Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex space-x-2">
          <button
            onClick={() => setView('list')}
            className={`px-4 py-2 rounded-md ${view === 'list' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-800'}`}
          >
            <List className="h-5 w-5 mr-2 inline" />
            List
          </button>
          <button
            onClick={() => setView('search')}
            className={`px-4 py-2 rounded-md ${view === 'search' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-800'}`}
          >
            <Search className="h-5 w-5 mr-2 inline" />
            Search
          </button>
          <button
            onClick={() => setView('create')}
            className={`px-4 py-2 rounded-md ${view === 'create' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-800'}`}
          >
            <Plus className="h-5 w-5 mr-2 inline" />
            Create
          </button>
        </div>
      </div>

      {/* List View */}
      {view === 'list' && (
        <LabInvoiceList 
          invoices={invoices} 
          onViewInvoice={handleViewInvoice} 
        />
      )}

      {/* Search View */}
      {view === 'search' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-4 mb-6">
            <input
              type="text"
              placeholder="Enter Prescription ID"
              value={prescriptionId}
              onChange={(e) => setPrescriptionId(e.target.value)}
              className="flex-grow px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              <Search className="h-5 w-5 mr-2 inline" />
              Search
            </button>
          </div>
        </div>
      )}

      {/* Create Manual Order View */}
      {view === 'create' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Patient Name</label>
              <input
                type="text"
                placeholder="Enter patient name"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Tests</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search and select tests"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setIsDropdownOpen(true);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {isDropdownOpen && (
                  <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-y-auto">
                    {tests
                      .filter(test => 
                        test.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
                        !selectedTests.includes(test.name)
                      )
                      .map(test => (
                        <div
                          key={test.name}
                          onClick={() => handleTestSelect(test.name)}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        >
                          {test.name}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
            {selectedTests.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Selected Tests</label>
                <div className="flex flex-wrap gap-2">
                  {selectedTests.map(test => (
                    <div 
                      key={test} 
                      className="flex items-center bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm"
                    >
                      {test}
                      <button 
                        onClick={() => handleTestRemove(test)}
                        className="ml-2 text-indigo-500 hover:text-indigo-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleCreateManualOrder}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Create Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice View */}
      {view === 'invoice' && selectedPrescription && renderInvoice()}
    </div>
  );
};
