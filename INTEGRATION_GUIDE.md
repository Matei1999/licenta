# Sleep Apnea Management System - Integrare Prototip

## Prezentare Generală

Acest document descrie integrarea prototipului complet de management pacienți OSA (Obstructive Sleep Apnea) în aplicația ta existentă.

## 🎯 Funcționalități Principale Implementate

### 1. **Modele de Date Extinse** ✅
- ✅ **Patient Model** actualizat cu 80+ câmpuri:
  - Date biometrice (înălțime, greutate, BMI, circumferință gât)
  - Demografie extinsă (stare civilă, educație, mediu, ocupație)
  - Screening OSA (STOP-BANG, Epworth, poziție somn)
  - Comorbidități (cardiovasculare, metabolice, respiratorii, neurologice)
  - Comportament & ORL (somn, fumat, alcool, anatomie căi aeriene)
  - Date psihosociale (PHQ-2, GAD-2, Rosenberg, WHOQOL-BREF)
  - Biomarkeri (CRP, HbA1c, colesterol, TSH, vitamină D)
  - Medicație (benzodiazepine, opioide, antihipertensive)
  - Istoric familial
  - Date CPAP (brand, model, mască, probleme tehnice, umidificare)

- ✅ **Visit Model** (nou):
  - Metrici somn (IAH, IAH rezidual, IAH NREM/REM)
  - Saturație oxigen (SpO2 min/max/medie, T90, T45, povară hipoxică)
  - Metrici CPAP (complianță %, utilizare medie, scurgeri, presiune)
  - Tip mască și potrivire

- ✅ **AuditLog Model** (nou):
  - Tracking complet al modificărilor
  - Istoricul changes cu old/new values
  - Metadata (userId, userName, IP, userAgent, timestamp)

### 2. **Backend API** ✅

#### Rute Noi Create:
```
POST   /api/visits              - Creează vizită nouă
GET    /api/visits              - Lista vizite cu filtre
GET    /api/visits/:id          - Detalii vizită
PUT    /api/visits/:id          - Actualizare vizită
DELETE /api/visits/:id          - Ștergere vizită
GET    /api/visits/patient/:patientId/stats - Statistici pacient

POST   /api/audit-logs          - Creează intrare audit
GET    /api/audit-logs          - Lista audit logs (admin)
GET    /api/audit-logs/entity/:type/:id - Istoric entitate
DELETE /api/audit-logs/cleanup  - Curățare logs vechi (>6 luni)
```

### 3. **Componente React** ✅

Componente create:
- ✅ `RomanianDateInput.js` - Selector date în română (zi/lună/an)
- ✅ `DataDictionary.js` - Dicționar complet de date medicale
- 🔄 **În curs**: Pagini detalii pacient cu tab-uri

### 4. **Funcționalități din Prototip**

#### ✅ Implementate în Backend:
1. **Auto-calculare BMI** (hook în modelul Patient)
2. **Actualizare lastVisit** la adăugare vizită
3. **Statistici vizite** (trend IAH, complianță medie)
4. **Filtre avansate** (dată, clinician, pacient)

#### 🔄 De Implementat în Frontend:
1. **Tab-uri Detalii Pacient**:
   - Personal (date identificare, biometrie, demografie)
   - Comorbidități (checkbox-uri ICD-10)
   - Comportament & ORL (somn, fumat, anatomie)
   - Psihosocial & Bio (chestionare, biomarkeri)
   - Vizite (listă cronologică)
   - CPAP (dispozitiv, statistici, probleme)
   - Note (notițe clinice)
   - Istoric (audit log modificări)
   - Consimțământ (GDPR)

2. **Formular Vizită**:
   - Metrici somn (IAH, SpO2, desaturare)
   - Metrici CPAP (complianță, utilizare, scurgeri)
   - Comparație cu vizita anterioară
   - Validare valori în range-uri medicale

3. **Rapoarte**:
   - Raport Complianță CPAP (ultimă lună)
   - Raport IAH Evolutiv (trend îmbunătățire/agravare)
   - Export CSV cu anonimizare (nume, CNP, pseudonimizare ID)

4. **Dicționar de Date**:
   - 80+ câmpuri documentate
   - Search cu filtrare
   - Badge-uri color-coded (GDPR, Obligatoriu, Numeric, etc.)
   - Range-uri normale și interpretare clinică

## 📦 Structura Baza de Date

### Modele Actualizate:

#### **patients** (Table)
```sql
-- Date identificare
id UUID PRIMARY KEY
firstName VARCHAR
lastName VARCHAR
cnp VARCHAR(13) UNIQUE
dateOfBirth DATE
gender ENUM('Male', 'Female', 'Other')
decedat BOOLEAN DEFAULT false

-- Biometrie
heightCm INTEGER
weightKg DECIMAL(5,2)
bmi DECIMAL(4,2) -- auto-calculat
neckCircumferenceCm INTEGER

-- Locație
county VARCHAR
locality VARCHAR
address JSONB

-- Demografie
maritalStatus ENUM
occupation VARCHAR
educationLevel ENUM
environmentType ENUM
householdSize INTEGER
childrenCount INTEGER

-- OSA Screening
stopBangScore INTEGER (0-8)
epworthScore INTEGER (0-24)
sleepPosition ENUM

-- Date complexe (JSONB)
comorbidities JSONB
behavioral JSONB
psychosocial JSONB
biomarkers JSONB
medications JSONB
familyHistory JSONB
cpapData JSONB
```

#### **visits** (Table - NOU)
```sql
id UUID PRIMARY KEY
patientId UUID REFERENCES patients(id)
visitDate DATE
clinician VARCHAR

-- Metrici somn
ahi DECIMAL(5,2)
ahiResidual DECIMAL(5,2)
desatIndex DECIMAL(5,2)
ahiNrem DECIMAL(5,2)
ahiRem DECIMAL(5,2)

-- Saturație oxigen
spo2Min INTEGER
spo2Max INTEGER
spo2Mean DECIMAL(4,2)
t90 DECIMAL(5,2)
t45 DECIMAL(5,2)
povaraHipoxica DECIMAL(7,2)

-- CPAP
cpapCompliancePct INTEGER
cpapUsageMin INTEGER
cpapLeaks95p DECIMAL(5,2)
maskType ENUM
maskFitGood BOOLEAN
```

#### **audit_logs** (Table - NOU)
```sql
id UUID PRIMARY KEY
entityType ENUM('patient', 'visit', 'sleepData', 'user')
entityId UUID
action ENUM('create', 'update', 'delete')
changes JSONB -- [{field, oldValue, newValue}]
userId UUID REFERENCES users(id)
userName VARCHAR
ipAddress VARCHAR
userAgent TEXT
timestamp TIMESTAMP
```

## 🚀 Pași de Implementare

### 1. Sincronizare Baza de Date
```bash
# Oprește serverul dacă rulează
# Sequelize va crea automat noile coloane și tabele

cd backend
npm run dev

# Verifică în logs:
# "Database models synchronized"
```

### 2. Testare API Visits
```bash
# Creează o vizită de test
POST http://localhost:5000/api/visits
Content-Type: application/json
Authorization: Bearer <your-token>

{
  "patientId": "<patient-uuid>",
  "visitDate": "2025-12-10",
  "clinician": "Dr. Test",
  "ahi": 28.5,
  "cpapCompliancePct": 85,
  "cpapUsageMin": 420,
  "maskType": "Nazală",
  "notes": "Vizită de control - evoluție bună"
}
```

### 3. Testare Audit Logs
```bash
# Vezi toate modificările pentru un pacient
GET http://localhost:5000/api/audit-logs/entity/patient/<patient-id>
Authorization: Bearer <your-token>
```

## 🎨 Componente UI de Creat

### Priority 1: Pagina Detalii Pacient cu Tab-uri

Fișier: `frontend/src/pages/PatientDetails.js`

Structură:
```jsx
<PatientDetails>
  <TabNavigation>
    - Personal
    - Comorbidități
    - Comportament & ORL
    - Psihosocial & Bio
    - Vizite
    - CPAP
    - Note
    - Istoric
    - Consimțământ
  </TabNavigation>
  
  <TabContent>
    {activeTab === 'Personal' && <PersonalTab />}
    {activeTab === 'Comorbidități' && <ComorbiditiesTab />}
    {/* ... */}
  </TabContent>
</PatientDetails>
```

### Priority 2: Formular Vizită

Fișier: `frontend/src/pages/VisitForm.js`

Features:
- Date vizită și clinician
- Comparație cu vizita anterioară (dacă există)
- Validare valori (range-uri medicale)
- Auto-save draft local

### Priority 3: Pagina Rapoarte

Fișier: `frontend/src/pages/Reports.js`

Features:
- Filtre: interval date, clinician, severitate
- Raport Complianță (grafic, tabel)
- Raport IAH Evolutiv (trend chart)
- Export CSV cu opțiuni anonimizare

## 📊 Exemple de Utilizare

### Exemplu 1: Creare Pacient Complet
```javascript
const newPatient = {
  firstName: "Ion",
  lastName: "Popescu",
  dateOfBirth: "1978-05-12",
  gender: "Male",
  email: "ion.popescu@email.com",
  phone: "+40712345678",
  
  // Biometrie
  heightCm: 178,
  weightKg: 98,
  neckCircumferenceCm: 43,
  // BMI calculat automat: 30.9
  
  // Screening OSA
  stopBangScore: 7,
  epworthScore: 16,
  sleepPosition: "Spate",
  
  // Comorbidități
  comorbidities: {
    cardiovascular: ["I10", "I25.1"], // HTA, Boală coronariană
    metabolic: ["E11.9"], // Diabet tip 2
    respiratory: [],
    neurologic: [],
    other: []
  },
  
  // Comportament
  behavioral: {
    avgSleepDuration: 6,
    sleepRhythm: "Regulat",
    hasNaps: true,
    smokingStatus: "Fumător activ (20 ani)",
    alcoholQuantity: "2-3 unități/zi",
    mallampati: "III",
    septumDeviation: true
  },
  
  // Date CPAP
  cpapData: {
    brand: "ResMed",
    model: "AirSense 10 AutoSet",
    therapyType: "APAP",
    pressureMin: 8,
    pressureMax: 14,
    startDate: "2025-08-02",
    maskType: "Nazală",
    humidificationEnabled: true,
    humidificationLevel: 4
  }
};
```

### Exemplu 2: Adăugare Vizită cu Metrici Complete
```javascript
const newVisit = {
  patientId: "uuid-pacient",
  visitDate: "2025-12-10",
  clinician: "Dr. Popescu Adrian",
  
  // Metrici somn
  ahi: 8.2,
  ahiNrem: 7.5,
  ahiRem: 11.2,
  desatIndex: 6.1,
  
  // Saturație oxigen
  spo2Min: 85,
  spo2Max: 98,
  spo2Mean: 94,
  t90: 2.5,
  
  // CPAP
  cpapCompliancePct: 96,
  cpapUsageMin: 485,
  cpapLeaks95p: 12.3,
  maskType: "Nazală",
  maskFitGood: true,
  
  notes: "Evoluție excelentă! IAH aproape normalizat. Pacient foarte motivat."
};
```

## 🔐 Securitate & GDPR

### Câmpuri Sensibile:
- ❗ **CNP**: Stocat în DB, acces restricționat
- ❗ **Email**: Pentru comunicare
- ❗ **Phone**: Pentru comunicare
- ❗ **Biomarkeri**: Date medicale sensibile

### Audit Trail:
- Toate modificările pacienților sunt logare în `audit_logs`
- Retention: 6 luni (cleanup automat)
- Include: user, IP, timestamp, changes (old→new)

### Export CSV Anonimizat:
```javascript
const exportOptions = {
  anonymizeNames: true,    // Elimină firstName + lastName
  removeCNP: true,          // Nu exportă CNP
  pseudonymize: true        // ID-uri → SUBJ-001, SUBJ-002, etc.
};
```

## 📈 Metrici Cheie (KPIs)

### Pentru Pacient:
1. **IAH** (Apnea-Hypopnea Index): <5 normal, 5-15 ușor, 15-30 moderat, >30 sever
2. **Complianță CPAP**: ≥70% = compliant (≥4h/noapte)
3. **IAH Rezidual**: <5 sub tratament = eficient
4. **T90**: <1% normal (timp cu SpO2<90%)

### Pentru Clinică:
1. **% Pacienți Complianți**: Target >70%
2. **Trend IAH**: % pacienți cu îmbunătățire
3. **Rata Abandon CPAP**: Target <20%

## 🐛 Debugging & Troubleshooting

### Eroare: "Cannot read property 'firstName' of null"
```javascript
// Verifică că pacientul există înainte de render
if (!patient) return <div>Loading...</div>;
```

### Eroare: "relation 'visits' does not exist"
```bash
# Asigură-te că Sequelize a sincronizat DB
# Verifică în terminal la pornire server:
# "Database models synchronized"
```

### Valori BMI nul
```javascript
// BMI se calculează automat în hook beforeSave
// Asigură-te că heightCm și weightKg sunt setate
```

## 📚 Referințe Medicale

### Scoruri Validate:
- **STOP-BANG**: 0-2 risc scăzut, 3-4 intermediar, 5-8 ridicat
- **Epworth**: 0-10 normal, 11-14 ușor, 15-24 sever
- **PHQ-2**: ≥3 screening pozitiv depresie
- **GAD-2**: ≥3 screening pozitiv anxietate
- **Mallampati**: I-IV (anatomie orofaringe)

### Range-uri Biomarkeri:
- **CRP**: <3 mg/L normal
- **HbA1c**: <5.7% normal, 5.7-6.4% prediabet, ≥6.5% diabet
- **LDL**: <100 mg/dL optimal
- **HDL**: >40 mg/dL (M), >50 mg/dL (F)
- **TSH**: 0.4-4.0 mIU/L normal
- **Vitamina D**: <20 deficit, 20-30 insuficient, >30 ng/mL suficient

## 🎯 Next Steps

### Imediat:
1. ✅ Pornește backend-ul și verifică sincronizarea DB
2. ⏳ Testează API-ul pentru visits (/api/visits)
3. ⏳ Creează formularul pentru adăugare vizită
4. ⏳ Implementează tab-urile în PatientDetails

### Următoare săptămână:
1. ⏳ Pagina de rapoarte cu grafice
2. ⏳ Export CSV cu anonimizare
3. ⏳ Dicționar de date complet (toate cele 80+ câmpuri)
4. ⏳ Middleware pentru audit automat (captează toate PUT/POST)

### Viitor:
1. ⏳ Dashboard cu KPIs
2. ⏳ Alerte pentru complianță scăzută (<70%)
3. ⏳ Grafice trend IAH pe pacient
4. ⏳ Integrare upload fișiere CPAP (ResMed/Philips)

## 💡 Tips & Best Practices

1. **Validare Date**: Folosește range-urile din dicționar pentru validare client-side
2. **UX**: Afișează valoarea anterioară când editezi un câmp (context)
3. **Performance**: Lazy-load tab-urile (nu încărca toate datele odată)
4. **Audit**: Loghează doar modificările semnificative (nu tracking-ul mouse-ului)
5. **Export**: Oferă mereu opțiune de anonimizare (GDPR compliance)

---
  
**Versiune**: 1.0 - Integrare Prototip Complet
