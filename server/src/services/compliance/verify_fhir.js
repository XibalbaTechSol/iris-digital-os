const FHIRAdapter = require('./fhir_adapter');

const mockParticipant = {
    id: 'P_001',
    mci: '1234567890',
    firstName: 'Maria',
    lastName: 'Johnson',
    phone: '(262) 555-0193',
    gender: 'Female',
    dob: '1952-03-15',
    address: '4217 Westfield Ave',
    city: 'Racine',
    zip: '53402',
    tenantId: 'CONNECTIONS_ICA'
};

const patient = FHIRAdapter.toPatient(mockParticipant);
console.log('--- FHIR PATIENT RESOURCE ---');
console.log(JSON.stringify(patient, null, 2));

const mockVisit = {
    id: 'V_123',
    participantMci: '1234567890',
    serviceCode: 'T1019',
    startTime: '2026-04-16T08:00:00Z',
    endTime: '2026-04-16T10:00:00Z',
    workerSantraxId: '999888777',
    gps: { lat: 43.0731, lng: -89.4012 }
};

const observation = FHIRAdapter.toObservation(mockVisit);
console.log('\n--- FHIR OBSERVATION RESOURCE ---');
console.log(JSON.stringify(observation, null, 2));
