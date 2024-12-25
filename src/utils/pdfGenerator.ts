import jsPDF from 'jspdf';
import type { Prescription } from '../types';
import { getGlobalSettings } from '../stores/globalSettingsStore';

const formatPrescriptionDetails = (prescription: Partial<Prescription>) => {
  const globalSettings = getGlobalSettings();
  const doctor = {
    name: globalSettings.doctorName || 'Dr. Ram Kumar',
    qualifications: globalSettings.doctorQualifications || 'MBBS, MD, MPH (USA)',
    regNo: globalSettings.doctorRegNo || 'Regd No: 54371',
    specialization: globalSettings.doctorSpecialization || 'Physician & Consultant (General Medicine)'
  };

  // EXTREME LOGGING OF ALL POSSIBLE PATIENT DETAIL SOURCES
  console.error('PATIENT DETAIL SOURCES:', {
    'Full Prescription Object': prescription,
    'Prescription Patient Object': prescription.patient,
    'Detailed Prescription Details': {
      patientId: prescription.patientId,
      patientName: prescription.patientName,
      gender: prescription.gender,
      age: prescription.age,
      phone: prescription.phone
    }
  });

  // Robust detail extraction function
  const extractDetail = (
    ...sources: (string | undefined | null)[]
  ): string => {
    const validSources = sources.filter(source => 
      source !== undefined && source !== null && source !== ''
    );

    const extractedValue = validSources[0] || 'Not Specified';
    
    console.error('DETAIL EXTRACTION:', {
      sources,
      extractedValue
    });

    return extractedValue;
  };

  // Prioritize patient details
  const patientName = extractDetail(
    prescription.patientName, 
    prescription.patient?.name,
    'Unknown Patient'
  );

  const patientGender = extractDetail(
    prescription.gender, 
    prescription.patient?.gender,
    'Not Specified'
  );

  const patientAge = extractDetail(
    prescription.age?.toString(), 
    prescription.patient?.age?.toString(),
    'Not Specified'
  );

  const patientPhone = extractDetail(
    prescription.phone, 
    prescription.patient?.phoneNumber,
    'Not Provided'
  );

  return {
    clinic: {
      name: globalSettings.clinicName || 'Suguna Clinic',
      address: globalSettings.clinicAddress || 'Vinayak Nagar, Hyderabad',
      location: globalSettings.clinicLocation || 'Hyderabad, Telangana',
      phone: globalSettings.clinicPhone || 'Ph: 9618994555',
      website: globalSettings.clinicWebsite || 'Website: sugunaclinic.com'
    },
    doctor,
    prescription: {
      id: prescription.prescriptionId || `OPD${Date.now()}`,
      date: new Date().toLocaleDateString(),
      visitId: prescription.visitId || `OCID${Date.now()}`,
      patientDetails: {
        name: patientName,
        gender: patientGender,
        age: patientAge,
        weight: prescription.vitalSigns?.weight || '',
        bp: prescription.vitalSigns?.bloodPressure || '',
        temperature: prescription.vitalSigns?.temperature ? `${prescription.vitalSigns.temperature} F` : '',
        phone: patientPhone,
        allergies: prescription.knownAllergies || ''
      },
      symptoms: prescription.symptoms || '',
      medications: prescription.medications || [],
      labTests: prescription.labTests || [],
      advice: prescription.advice || ''
    }
  };
};

export const generatePrescriptionPDF = async (prescription: Partial<Prescription>, returnBlob: boolean = false): Promise<{ blob: Blob; url: string } | void> => {
  console.error('FULL PRESCRIPTION OBJECT:', JSON.stringify(prescription, null, 2));

  // FORCE patient details into the prescription object
  const forcedPrescription = {
    ...prescription,
    patientName: prescription.patientName 
      || prescription.patient?.name 
      || prescription.patient?.patientName 
      || 'Unknown Patient',
    gender: prescription.gender 
      || prescription.patient?.gender 
      || prescription.patientGender 
      || 'Not Specified',
    age: prescription.age 
      || prescription.patient?.age?.toString() 
      || prescription.patientAge 
      || 'Not Specified',
    phone: prescription.phone 
      || prescription.patient?.phoneNumber 
      || prescription.patientPhone 
      || 'Not Provided'
  };

  console.error('FORCED PRESCRIPTION DETAILS:', JSON.stringify(forcedPrescription, null, 2));

  const doc = new jsPDF();
  
  const details = formatPrescriptionDetails(forcedPrescription);

  console.error('FINAL PDF DETAILS:', JSON.stringify(details, null, 2));

  // Debug logging for patient details
  console.log('Patient Details:', {
    patientName: forcedPrescription.patientName,
    patientId: forcedPrescription.patientId,
    patient: forcedPrescription.patient,
    gender: forcedPrescription.gender,
    age: forcedPrescription.age,
    phone: forcedPrescription.phone
  });

  // Fallback to manual patient detail extraction if needed
  if (!details.prescription.patientDetails.name && forcedPrescription.patient) {
    details.prescription.patientDetails.name = forcedPrescription.patient.name;
    details.prescription.patientDetails.gender = forcedPrescription.patient.gender;
    details.prescription.patientDetails.age = forcedPrescription.patient.age.toString();
    details.prescription.patientDetails.phone = forcedPrescription.patient.phoneNumber;
  }

  console.log('Formatted PDF Details:', details);
  
  // Add clinic logo if available
  const clinicLogo = getGlobalSettings().clinicLogo;
  if (clinicLogo) {
    try {
      doc.addImage(clinicLogo, 'PNG', 15, 10, 30, 30);
    } catch (error) {
      console.error('Error adding clinic logo:', error);
    }
  }

  // Header - Clinic Details (Left Side)
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(details.clinic.name, 50, 20);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(details.clinic.address, 50, 25);
  doc.text(details.clinic.location, 50, 30);
  doc.text(details.clinic.phone, 50, 35);
  doc.text(details.clinic.website, 50, 40);

  // Header - Doctor Details (Right Side)
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(details.doctor.name, 140, 20);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(details.doctor.qualifications, 140, 25);
  doc.text(details.doctor.specialization, 140, 30);
  doc.text(details.doctor.regNo, 140, 35);

  // Prescription Details
  doc.line(15, 45, 195, 45); // Horizontal line

  // Prescription ID and Date
  doc.setFontSize(10);
  doc.text(`Prescription ${details.prescription.id}`, 15, 55);
  doc.text(`Date : ${details.prescription.date}`, 140, 55);

  // Patient Details - Left Column
  let y = 65;
  doc.text('OPD ID', 15, y);
  doc.text(': ' + details.prescription.id, 60, y);
  doc.text('OPD Visit ID', 110, y);
  doc.text(': ' + details.prescription.visitId, 160, y);

  y += 7;
  doc.text('Patient Name', 15, y);
  doc.text(': ' + details.prescription.patientDetails.name, 60, y);
  doc.text('Age', 110, y);
  doc.text(': ' + details.prescription.patientDetails.age, 160, y);

  y += 7;
  doc.text('Gender', 15, y);
  doc.text(': ' + details.prescription.patientDetails.gender, 60, y);
  doc.text('Weight', 110, y);
  doc.text(': ' + details.prescription.patientDetails.weight + ' kg', 160, y);

  y += 7;
  doc.text('BP', 15, y);
  doc.text(': ' + details.prescription.patientDetails.bp, 60, y);
  doc.text('Temperature', 110, y);
  doc.text(': ' + details.prescription.patientDetails.temperature, 160, y);

  y += 7;
  doc.text('Phone', 15, y);
  doc.text(': ' + details.prescription.patientDetails.phone, 60, y);
  doc.text('Allergies', 110, y);
  doc.text(': ' + details.prescription.patientDetails.allergies, 160, y);

  y += 7;
  doc.text('Consultant Doctor', 15, y);
  doc.text(': ' + details.doctor.name, 60, y);

  // Symptoms 
  y += 15;
  doc.setFont('helvetica', 'bold');
  doc.text('Symptoms:', 15, y);
  doc.setFont('helvetica', 'normal');
  doc.text(details.prescription.symptoms, 25, y + 7);

  // Medications
  y += 25;
  doc.setFont('helvetica', 'bold');
  doc.text('Medicines', 15, y);

  // Medication Table Headers
  y += 7;
  doc.setFontSize(9);
  doc.text('#', 15, y);
  doc.text('Category', 25, y);
  doc.text('Medicine', 45, y);
  doc.text('Dosage', 105, y);
  doc.text('Interval', 130, y);
  doc.text('Duration', 160, y);
  doc.text('Instruction', 185, y);

  // Medication Rows
  doc.setFont('helvetica', 'normal');
  details.prescription.medications.forEach((med, index) => {
    y += 7;
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    doc.text((index + 1).toString(), 15, y);
    doc.text('Tab', 25, y);
    doc.text(med.name, 45, y);
    doc.text(med.dosage, 105, y);
    doc.text(med.interval, 130, y);
    doc.text(med.duration, 160, y);
    doc.text(med.instructions, 185, y);
  });

  // Lab Tests
  if (details.prescription.labTests.length > 0) {
    y += 15;
    doc.setFont('helvetica', 'bold');
    doc.text('Pathology Test', 15, y);
    details.prescription.labTests.forEach((test, index) => {
      y += 7;
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.setFont('helvetica', 'normal');
      doc.text(`${index + 1}. ${test}`, 15, y);
    });
  }

  // Additional Advice
  if (details.prescription.advice) {
    y += 15;
    doc.setFont('helvetica', 'normal');
    doc.text(details.prescription.advice, 15, y);
  }

  // Return blob and URL or save file
  if (returnBlob) {
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    return { blob, url };
  } else {
    const filename = `prescription-${details.prescription.id}-${Date.now()}.pdf`;
    try {
      doc.save(filename);
      console.log(`PDF saved: ${filename}`);
    } catch (error) {
      console.error('Error saving PDF:', error);
      throw error;
    }
  }
};
