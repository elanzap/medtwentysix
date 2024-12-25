import { useState, useEffect, useCallback } from 'react';
import type { Prescription, VitalSigns, Medication } from '../types';

export const usePrescription = (patientId: string, initialData?: Partial<Prescription>) => {
  const [prescription, setPrescription] = useState<Partial<Prescription>>({
    patientId,
    date: new Date().toISOString(),
    diagnoses: [],
    medications: [],
    labTests: [],
    // Explicitly add patient details from initial data
    patientName: initialData?.patientName,
    gender: initialData?.gender || initialData?.patient?.gender,
    age: initialData?.age || initialData?.patient?.age?.toString(),
    phone: initialData?.phone || initialData?.patient?.phoneNumber,
    ...initialData,
  });

  useEffect(() => {
    if (initialData) {
      setPrescription(prev => ({
        ...prev, 
        ...initialData,
        // Ensure patient details are added even if not in initial data
        patientName: initialData.patientName || prev.patientName,
        gender: initialData.gender || initialData.patient?.gender || prev.gender,
        age: initialData.age || initialData.patient?.age?.toString() || prev.age,
        phone: initialData.phone || initialData.patient?.phoneNumber || prev.phone
      }));
    }
  }, [initialData?.prescriptionId]);

  const updateVitalSigns = useCallback((vitalSigns: VitalSigns) => {
    setPrescription(prev => ({ ...prev, vitalSigns }));
  }, []);

  const updateSymptoms = useCallback((symptoms: string) => {
    setPrescription(prev => ({ ...prev, symptoms }));
  }, []);

  const updateDiagnoses = useCallback((diagnoses: string[]) => {
    setPrescription(prev => ({ ...prev, diagnoses }));
  }, []);

  const updateMedications = useCallback((medications: Medication[]) => {
    setPrescription(prev => ({ ...prev, medications }));
  }, []);

  const updateLabTests = useCallback((labTests: string[]) => {
    setPrescription(prev => ({ ...prev, labTests }));
  }, []);

  return {
    prescription,
    updateVitalSigns,
    updateSymptoms,
    updateDiagnoses,
    updateMedications,
    updateLabTests,
  };
};
