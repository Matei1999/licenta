import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const DictCard = ({ title, badge, type, desc, example, unit, range, canModify = true, nullAllowed = false, derived, searchQuery = '' }) => {
  // Filter logic
  if (searchQuery && searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    const matchesTitle = title.toLowerCase().includes(query);
    const matchesDesc = desc.toLowerCase().includes(query);
    const matchesBadge = badge && badge.toLowerCase().includes(query);
    const matchesType = type && type.toLowerCase().includes(query);
    
    if (!matchesTitle && !matchesDesc && !matchesBadge && !matchesType) {
      return null;
    }
  }
  
  const badgeColors = {
    'PK': 'bg-purple-100 text-purple-700',
    'Sensibil GDPR': 'bg-red-100 text-red-700',
    'Obligatoriu': 'bg-teal-100 text-teal-700',
    'Numeric': 'bg-blue-100 text-blue-700',
    'Calculat': 'bg-green-100 text-green-700',
    'Important OSA': 'bg-orange-100 text-orange-700',
    'Metrică Primară': 'bg-indigo-100 text-indigo-700',
    'KPI Principal': 'bg-pink-100 text-pink-700',
    'Screening': 'bg-yellow-100 text-yellow-700',
  };
  
  return (
    <div className="rounded-xl bg-white p-4 border border-gray-200/80 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-bold text-[#065f46] font-mono">{title}</h3>
        {badge && <span className={`rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap ${badgeColors[badge] || 'bg-gray-100 text-gray-700'}`}>{badge}</span>}
      </div>
      <p className="mt-2 text-sm text-[#0d9488]">{desc}</p>
      <div className="mt-4 space-y-3 border-t border-gray-200/80 pt-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#0d9488]">Tip de date</p>
          <p className="mt-1 text-sm text-[#065f46]">{type}</p>
        </div>
        {unit && (
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#0d9488]">Unitate măsură</p>
            <p className="mt-1 text-sm text-[#065f46]">{unit}</p>
          </div>
        )}
        {range && (
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#0d9488]">Interval / Interpretare</p>
            <p className="mt-1 text-sm text-[#065f46]">{range}</p>
          </div>
        )}
        {example && (
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#0d9488]">Exemplu</p>
            <p className="mt-1 text-sm font-mono text-[#065f46]">{example}</p>
          </div>
        )}
        {derived && (
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#0d9488]">Derivat din</p>
            <p className="mt-1 text-sm font-mono text-[#065f46]">{derived}</p>
          </div>
        )}
        <div className="flex gap-4 pt-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#0d9488]">Se modifică?</p>
            <p className="mt-1 text-sm text-[#065f46]">{canModify ? 'Da' : 'Nu'}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#0d9488]">Poate fi NULL?</p>
            <p className="mt-1 text-sm text-[#065f46]">{nullAllowed ? 'Da' : 'Nu'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const DataDictionary = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-gray-200/80 bg-[#f0fdfa] px-4">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 text-[#0d9488] hover:text-[#065f46]"
        >
          <span className="text-sm font-semibold">← Înapoi</span>
        </button>
        <h1 className="text-lg font-bold text-[#065f46]">Dicționar de Date</h1>
        <div className="w-24"></div>
      </header>
      
      <main className="px-4 pb-24 pt-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Caută câmp medical..." 
            className="w-full rounded-lg border border-gray-200 bg-[#f0fdfa] px-4 py-3 text-sm text-[#065f46] placeholder:text-[#0d9488]/60 focus:outline-none focus:ring-2 focus:ring-[#14b8a6] focus:border-transparent" 
          />
        </div>
        
        {/* Aici adaugi toate componentele DictCard din prototip */}
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-[#0d9488]">1. Date Identificare & Demografice</h2>
        <div className="mb-6 flex flex-col gap-3">
          <DictCard 
            title="patient_id" 
            badge="PK" 
            type="UUID" 
            desc="Identificator unic intern al pacientului, generat automat la creare." 
            example="550e8400-e29b-41d4-a716-446655440000" 
            canModify={false}
            searchQuery={searchQuery}
          />
          <DictCard 
            title="cnp" 
            badge="Sensibil GDPR" 
            type="String (13 caractere)" 
            desc="Cod Numeric Personal - FOARTE SENSIBIL. Acces strict controlat." 
            example="1234567891234" 
            canModify={false} 
            nullAllowed
            searchQuery={searchQuery}
          />
          <DictCard 
            title="firstName" 
            badge="Sensibil GDPR" 
            type="String" 
            desc="Prenumele pacientului." 
            example="Ion" 
            canModify
            searchQuery={searchQuery}
          />
          <DictCard 
            title="lastName" 
            badge="Sensibil GDPR" 
            type="String" 
            desc="Numele de familie al pacientului." 
            example="Popescu" 
            canModify
            searchQuery={searchQuery}
          />
          <DictCard 
            title="dateOfBirth" 
            badge="Obligatoriu" 
            type="Date (YYYY-MM-DD)" 
            desc="Data nașterii pacientului, utilizată pentru calcularea vârstei." 
            example="1978-05-12" 
            canModify
            searchQuery={searchQuery}
          />
          <DictCard 
            title="gender" 
            badge="Obligatoriu" 
            type="Enum (Male/Female)" 
            desc="Genul biologic al pacientului, relevant pentru interpretarea unor parametri." 
            example="Male" 
            canModify
            searchQuery={searchQuery}
          />
          <DictCard 
            title="decedat" 
            badge="Important OSA" 
            type="Boolean" 
            desc="Indică dacă pacientul este decedat. Relevant pentru audit și statistici." 
            example="false" 
            canModify
            nullAllowed
            searchQuery={searchQuery}
          />
          <DictCard 
            title="email" 
            badge="Sensibil GDPR" 
            type="String (email)" 
            desc="Adresa de email pentru comunicare cu pacientul." 
            example="ion.popescu@email.ro" 
            canModify
            nullAllowed
            searchQuery={searchQuery}
          />
          <DictCard 
            title="phone" 
            badge="Sensibil GDPR" 
            type="String (telefon)" 
            desc="Număr de telefon de contact în format internațional." 
            example="+40712345678" 
            canModify
            nullAllowed
            searchQuery={searchQuery}
          />
        </div>

        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-[#0d9488]">2. Biometrie & Măsurători Fizice</h2>
        <div className="mb-6 flex flex-col gap-3">
          <DictCard 
            title="heightCm" 
            badge="Numeric" 
            type="Integer" 
            desc="Înălțimea pacientului în centimetri." 
            example="178" 
            unit="cm"
            range="120-220 cm"
            canModify
            searchQuery={searchQuery}
          />
          <DictCard 
            title="weightKg" 
            badge="Numeric" 
            type="Decimal" 
            desc="Greutatea corporală în kilograme." 
            example="98.5" 
            unit="kg"
            range="30-250 kg"
            canModify
            searchQuery={searchQuery}
          />
          <DictCard 
            title="bmi" 
            badge="Calculat" 
            type="Decimal" 
            desc="Indicele de masă corporală - calculat automat din greutate și înălțime." 
            example="30.9" 
            unit="kg/m²"
            range="<18.5: Subponderal | 18.5-24.9: Normal | 25-29.9: Supraponderal | ≥30: Obezitate"
            canModify={false}
            derived="weightKg / (heightCm/100)²"
            searchQuery={searchQuery}
          />
          <DictCard 
            title="neckCircumferenceCm" 
            badge="Important OSA" 
            type="Integer" 
            desc="Circumferința gâtului - predictor important pentru OSA. Risc crescut: >43cm (bărbați), >41cm (femei)." 
            example="43" 
            unit="cm"
            range="25-60 cm | Risc OSA: >43cm (M), >41cm (F)"
            canModify
            searchQuery={searchQuery}
          />
        </div>

        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-[#0d9488]">3. Locație & Demografie Extinsă</h2>
        <div className="mb-6 flex flex-col gap-3">
          <DictCard 
            title="county" 
            type="String" 
            desc="Județul de reședință al pacientului." 
            example="București" 
            canModify
            nullAllowed
            searchQuery={searchQuery}
          />
          <DictCard 
            title="locality" 
            type="String" 
            desc="Localitatea/orașul de reședință." 
            example="Sector 1" 
            canModify
            nullAllowed
            searchQuery={searchQuery}
          />
          <DictCard 
            title="maritalStatus" 
            type="Enum" 
            desc="Starea civilă a pacientului." 
            example="Căsătorit" 
            range="Necăsătorit | Căsătorit | Divorțat | Văduv"
            canModify
            nullAllowed
            searchQuery={searchQuery}
          />
          <DictCard 
            title="occupation" 
            type="String" 
            desc="Ocupația/profesia pacientului. Relevantă pentru evaluarea factorilor de risc ocupaționali." 
            example="Inginer software" 
            canModify
            nullAllowed
            searchQuery={searchQuery}
          />
          <DictCard 
            title="educationLevel" 
            type="Enum" 
            desc="Nivelul de educație, influențează aderența la tratament." 
            example="Universitar" 
            range="Primar | Gimnazial | Liceal | Universitar | Postuniversitar"
            canModify
            nullAllowed
            searchQuery={searchQuery}
          />
          <DictCard 
            title="environmentType" 
            type="Enum" 
            desc="Mediul de trai (urban/rural/suburban)." 
            example="Urban" 
            range="Urban | Rural | Suburban"
            canModify
            nullAllowed
            searchQuery={searchQuery}
          />
          <DictCard 
            title="householdSize" 
            badge="Numeric" 
            type="Integer" 
            desc="Numărul de persoane în gospodărie." 
            example="4" 
            range="1-20"
            canModify
            nullAllowed
            searchQuery={searchQuery}
          />
          <DictCard 
            title="childrenCount" 
            badge="Numeric" 
            type="Integer" 
            desc="Numărul de copii ai pacientului." 
            example="2" 
            range="0-15"
            canModify
            nullAllowed
            searchQuery={searchQuery}
          />
        </div>

        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-[#0d9488]">4. Screening OSA</h2>
        <div className="mb-6 flex flex-col gap-3">
          <DictCard 
            title="stopBangScore" 
            badge="Screening" 
            type="Integer (0-8)" 
            desc="Scor STOP-BANG pentru screening OSA. Score-uri mari indică risc crescut de OSA." 
            example="7" 
            range="0-2: Risc scăzut | 3-4: Risc intermediar | 5-8: Risc înalt"
            canModify
            searchQuery={searchQuery}
          />
          <DictCard 
            title="epworthScore" 
            badge="Screening" 
            type="Integer (0-24)" 
            desc="Scala Epworth de Somnolență - măsoară tendința de a adormi în situații zilnice." 
            example="16" 
            range="0-10: Normal | 11-15: Somnolență ușoară | 16-24: Somnolență severă"
            canModify
            searchQuery={searchQuery}
          />
          <DictCard 
            title="sasoForm" 
            badge="Important OSA" 
            type="Enum" 
            desc="Forma apneei de somn conform clasificării SASO." 
            example="Severă" 
            range="Ușoară | Moderată | Severă"
            canModify
            searchQuery={searchQuery}
          />
          <DictCard 
            title="sleepPosition" 
            type="Enum" 
            desc="Poziția preferată de somn. OSA poate fi pozițional (mai sever în decubit dorsal)." 
            example="Spate" 
            range="Spate | Lateral | Prone | Variabil"
            canModify
            nullAllowed
            searchQuery={searchQuery}
          />
        </div>

        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-[#0d9488]">5. Comportament & Factori de Risc</h2>
        <div className="mb-6 flex flex-col gap-3">
          <DictCard 
            title="avgSleepDuration" 
            badge="Numeric" 
            type="Decimal" 
            desc="Durata medie de somn pe noapte în ore." 
            example="6.5" 
            unit="ore"
            range="Recomandat: 7-9 ore"
            canModify
            searchQuery={searchQuery}
          />
          <DictCard 
            title="bedtimeTypical" 
            type="Time (HH:MM)" 
            desc="Ora tipică de culcare a pacientului." 
            example="23:00" 
            canModify
            nullAllowed
            searchQuery={searchQuery}
          />
          <DictCard 
            title="waketimeTypical" 
            type="Time (HH:MM)" 
            desc="Ora tipică de trezire a pacientului." 
            example="07:30" 
            canModify
            nullAllowed
            searchQuery={searchQuery}
          />
          <DictCard 
            title="sleepVariability" 
            type="Enum" 
            desc="Variabilitatea programului de somn între zile." 
            example="Ușoară variație" 
            range="Foarte regulat | Ușoară variație | Variabil | Haotic"
            canModify
            nullAllowed
            searchQuery={searchQuery}
          />
          <DictCard 
            title="fragmentedSleep" 
            type="Boolean" 
            desc="Dacă pacientul raportează treziri frecvente în timpul nopții." 
            example="true" 
            canModify
            nullAllowed
            searchQuery={searchQuery}
          />
          <DictCard 
            title="sleepRhythm" 
            type="String" 
            desc="Regularitatea ritmului somn-veghe." 
            example="Regulat" 
            range="Regulat | Neregulat | Schimbător (ture)"
            canModify
            nullAllowed
            searchQuery={searchQuery}
          />
          <DictCard 
            title="hasNaps" 
            type="Boolean" 
            desc="Dacă pacientul face pauze de somn în timpul zilei." 
            example="true" 
            canModify
            nullAllowed
            searchQuery={searchQuery}
          />
          <DictCard 
            title="napFrequency" 
            type="Enum" 
            desc="Frecvența pisodelelor zilnice (se afișează doar dacă hasNaps=true)." 
            example="Zilnic" 
            range="Rar | Ocazional | Zilnic | Multiplu pe zi"
            canModify
            nullAllowed
            searchQuery={searchQuery}
          />
          <DictCard 
            title="napDurationMin" 
            badge="Numeric" 
            type="Integer" 
            desc="Durata medie a pisodelelor în minute." 
            example="45" 
            unit="minute"
            canModify
            nullAllowed
            searchQuery={searchQuery}
          />
          <DictCard 
            title="smokingStatus" 
            type="Enum" 
            desc="Statutul de fumător al pacientului." 
            example="Fumător activ" 
            range="Niciodată | Fost fumător | Fumător activ"
            canModify
            nullAllowed
            searchQuery={searchQuery}
          />
          <DictCard 
            title="cigarettesPerDay" 
            badge="Numeric" 
            type="Integer" 
            desc="Numărul de țigări pe zi (pentru fumători activi)." 
            example="20" 
            unit="țigări/zi"
            canModify
            nullAllowed
            searchQuery={searchQuery}
          />
          <DictCard 
            title="alcoholFrequency" 
            type="Enum" 
            desc="Frecvența consumului de alcool." 
            example="Zilnic" 
            range="Niciodată | Rar | Săptămânal | Zilnic"
            canModify
            nullAllowed
            searchQuery={searchQuery}
          />
          <DictCard 
            title="alcoholQuantity" 
            type="String" 
            desc="Consumul de alcool zilnic/săptămânal." 
            example="2-3 unități/zi" 
            canModify
            nullAllowed
            searchQuery={searchQuery}
          />
          <DictCard 
            title="caffeineIntake" 
            type="String" 
            desc="Consumul de cofeină (cafea, ceai energizante)." 
            example="3-4 cafele/zi" 
            canModify
            nullAllowed
            searchQuery={searchQuery}
          />
          <DictCard 
            title="caffeineUnits" 
            badge="Numeric" 
            type="Integer" 
            desc="Numărul de băuturi cu cofeină consumate zilnic (deprecated - folosiți caffeineIntake)." 
            example="4" 
            unit="unități/zi"
            canModify
            nullAllowed
            searchQuery={searchQuery}
          />
          <DictCard 
            title="physicalActivityLevel" 
            type="Enum" 
            desc="Nivelul general de activitate fizică." 
            example="Moderat" 
            range="Sedentar | Ușor | Moderat | Activ"
            canModify
            nullAllowed
            searchQuery={searchQuery}
          />
          <DictCard 
            title="physicalActivityHours" 
            badge="Numeric" 
            type="Decimal" 
            desc="Ore de activitate fizică moderată pe săptămână." 
            example="3.5" 
            unit="ore/săptămână"
            range="Recomandat: ≥2.5 ore/săptămână"
            canModify
            nullAllowed
            searchQuery={searchQuery}
          />
          <DictCard 
            title="physicalActivityMin" 
            badge="Numeric" 
            type="Integer" 
            desc="Activitate fizică moderată în minute pe zi (deprecated - folosiți physicalActivityHours)." 
            example="60" 
            unit="minute/zi"
            range="Recomandat: ≥150 min/săptămână"
            canModify
            nullAllowed
            searchQuery={searchQuery}
          />
          <DictCard 
            title="sleepPositionPrimary" 
            type="Enum" 
            desc="Poziția principală în care doarme pacientul." 
            example="Lateral" 
            range="Dorsal | Lateral | Prone | Mixt"
            canModify
            nullAllowed
            searchQuery={searchQuery}
          />
          <DictCard 
            title="positionalOSA" 
            badge="Important OSA" 
            type="Boolean" 
            desc="Indică dacă OSA este influențat semnificativ de poziția de somn (mai sever în decubit dorsal)." 
            example="true" 
            canModify
            nullAllowed
            searchQuery={searchQuery}
          />
        </div>

        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-[#0d9488]">6. Anatomie ORL</h2>
        <div className="mb-6 flex flex-col gap-3">
          <DictCard 
            title="mallampati" 
            badge="Important OSA" 
            type="Enum (I-IV)" 
            desc="Scorul Mallampati evaluează dimensiunea limbii relative la faringe. Scoruri mari indică risc OSA." 
            example="III" 
            range="I: Fără obstrucție | II: Ușoară | III: Moderată | IV: Severă"
            canModify
            nullAllowed
            searchQuery={searchQuery}
          />
          <DictCard 
            title="septumDeviation" 
            type="Boolean" 
            desc="Prezența deviației de sept nazal care poate obstrucționa respirația." 
            example="true" 
            canModify
            nullAllowed
            searchQuery={searchQuery}
          />
          <DictCard 
            title="macroglossia" 
            type="Boolean" 
            desc="Limbă anormal de mare care poate obstrucționa căile aeriene." 
            example="false" 
            canModify
            nullAllowed
            searchQuery={searchQuery}
          />
          <DictCard 
            title="tonsillarHypertrophy" 
            type="Boolean" 
            desc="Hipertrofia amigdalelor care reduce spațiul faringian." 
            example="false" 
            canModify
            nullAllowed
            searchQuery={searchQuery}
          />
        </div>

        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-[#0d9488]">7. Evaluare Psihosocială</h2>
        <div className="mb-6 flex flex-col gap-3">
          <DictCard 
            title="phq2" 
            badge="Screening" 
            type="Integer (0-6)" 
            desc="Patient Health Questionnaire-2 pentru screening depresie." 
            example="3" 
            range="0-2: Risc scăzut | ≥3: Screening pozitiv (necesită evaluare PHQ-9)"
            canModify
            searchQuery={searchQuery}
          />
          <DictCard 
            title="gad2" 
            badge="Screening" 
            type="Integer (0-6)" 
            desc="Generalized Anxiety Disorder-2 pentru screening anxietate." 
            example="4" 
            range="0-2: Risc scăzut | ≥3: Screening pozitiv (necesită evaluare GAD-7)"
            canModify
            searchQuery={searchQuery}
          />
          <DictCard 
            title="rosenberg" 
            badge="Screening" 
            type="Integer (10-40)" 
            desc="Scala Rosenberg de stimă de sine." 
            example="28" 
            range="<15: Stimă scăzută | 15-25: Normală | >25: Ridicată"
            canModify
            searchQuery={searchQuery}
          />
          <DictCard 
            title="whoqolPhysical" 
            type="Integer (0-100)" 
            desc="WHOQOL-BREF dimensiunea fizică - calitatea vieții legate de sănătatea fizică." 
            example="62" 
            unit="puncte (0-100)"
            canModify
            searchQuery={searchQuery}
          />
          <DictCard 
            title="whoqolPsychological" 
            type="Integer (0-100)" 
            desc="WHOQOL-BREF dimensiunea psihologică." 
            example="58" 
            unit="puncte (0-100)"
            canModify
            searchQuery={searchQuery}
          />
          <DictCard 
            title="whoqolSocial" 
            type="Integer (0-100)" 
            desc="WHOQOL-BREF dimensiunea relațiilor sociale." 
            example="65" 
            unit="puncte (0-100)"
            canModify
            searchQuery={searchQuery}
          />
          <DictCard 
            title="whoqolEnvironment" 
            type="Integer (0-100)" 
            desc="WHOQOL-BREF dimensiunea mediului de viață." 
            example="70" 
            unit="puncte (0-100)"
            canModify
            searchQuery={searchQuery}
          />
        </div>

        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-[#0d9488]">8. Biomarkeri Laborator</h2>
        <div className="mb-6 flex flex-col gap-3">
          <DictCard 
            title="crp" 
            badge="Numeric" 
            type="Decimal" 
            desc="Proteina C Reactivă - marker inflamație sistemică." 
            example="4.2" 
            unit="mg/L"
            range="<3: Normal | 3-10: Ușor crescut | >10: Inflamație semnificativă"
            canModify
            searchQuery={searchQuery}
          />
          <DictCard 
            title="hba1c" 
            badge="Numeric" 
            type="Decimal" 
            desc="Hemoglobina glicată - control glicemic pe 3 luni." 
            example="6.8" 
            unit="%"
            range="<5.7: Normal | 5.7-6.4: Prediabet | ≥6.5: Diabet"
            canModify
            searchQuery={searchQuery}
          />
          <DictCard 
            title="ldl" 
            badge="Numeric" 
            type="Integer" 
            desc="Colesterol LDL ('colesterol rău')." 
            example="145" 
            unit="mg/dL"
            range="<100: Optimal | 100-129: Aproape optimal | 130-159: Limită înaltă | ≥160: Înalt"
            canModify
            searchQuery={searchQuery}
          />
          <DictCard 
            title="hdl" 
            badge="Numeric" 
            type="Integer" 
            desc="Colesterol HDL ('colesterol bun')." 
            example="38" 
            unit="mg/dL"
            range=">60: Protector | 40-60: Normal | <40 (M) sau <50 (F): Risc cardiovascular"
            canModify
            searchQuery={searchQuery}
          />
          <DictCard 
            title="triglycerides" 
            badge="Numeric" 
            type="Integer" 
            desc="Trigliceride serice." 
            example="210" 
            unit="mg/dL"
            range="<150: Normal | 150-199: Limită înaltă | 200-499: Înalt | ≥500: Foarte înalt"
            canModify
            searchQuery={searchQuery}
          />
          <DictCard 
            title="tsh" 
            badge="Numeric" 
            type="Decimal" 
            desc="Hormon tiroidian stimulant - funcție tiroidiană." 
            example="2.1" 
            unit="mIU/L"
            range="0.4-4.0: Normal | <0.4: Hipertiroidism | >4.0: Hipotiroidism"
            canModify
            searchQuery={searchQuery}
          />
          <DictCard 
            title="vitaminD" 
            badge="Numeric" 
            type="Integer" 
            desc="Vitamina D serică (25-OH Vitamina D)." 
            example="18" 
            unit="ng/mL"
            range="<20: Deficit | 20-30: Insuficient | >30: Suficient | >100: Toxic"
            canModify
            searchQuery={searchQuery}
          />
          <DictCard 
            title="creatinine" 
            badge="Numeric" 
            type="Decimal" 
            desc="Creatinină serică - funcție renală." 
            example="0.9" 
            unit="mg/dL"
            range="0.6-1.2: Normal (M) | 0.5-1.1: Normal (F)"
            canModify
            searchQuery={searchQuery}
          />
        </div>

        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-[#0d9488]">9. Medicație care influențează OSA</h2>
        <div className="mb-6 flex flex-col gap-3">
          <DictCard 
            title="benzodiazepines" 
            badge="Important OSA" 
            type="Boolean" 
            desc="Pacientul ia benzodiazepine. Pot agrava AHI și somnolența prin relaxarea musculaturii faringiene." 
            example="true" 
            canModify
            nullAllowed
            searchQuery={searchQuery}
          />
          <DictCard 
            title="opioids" 
            badge="Important OSA" 
            type="Boolean" 
            desc="Pacientul ia opioide. Risc major de agravare OSA prin depresie respiratorie centrală." 
            example="false" 
            canModify
            nullAllowed
            searchQuery={searchQuery}
          />
          <DictCard 
            title="sedativeAntidepressants" 
            badge="Important OSA" 
            type="Boolean" 
            desc="Antidepresive cu efect sedativ (ex: mirtazapină, trazodone)." 
            example="false" 
            canModify
            nullAllowed
            searchQuery={searchQuery}
          />
          <DictCard 
            title="antihypertensives" 
            badge="Important OSA" 
            type="Boolean" 
            desc="Antihipertensive, în special beta-blocante care pot afecta somnul." 
            example="true" 
            canModify
            nullAllowed
            searchQuery={searchQuery}
          />
          <DictCard 
            title="corticosteroids" 
            type="Boolean" 
            desc="Corticosteroizi care pot cauza creștere ponderală și modificări metabolice." 
            example="false" 
            canModify
            nullAllowed
            searchQuery={searchQuery}
          />
          <DictCard 
            title="antihistamines" 
            type="Boolean" 
            desc="Antihistaminice cu efect sedativ (generația 1)." 
            example="false" 
            canModify
            nullAllowed
            searchQuery={searchQuery}
          />
          <DictCard 
            title="hypnotics" 
            type="Boolean" 
            desc="Hipnotice non-benzodiazepinice (zolpidem, zaleplon) pentru insomnie." 
            example="false" 
            canModify
            nullAllowed
            searchQuery={searchQuery}
          />
        </div>

        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-[#0d9488]">10. ORL Complete & Anatomie</h2>
        <div className="mb-6 flex flex-col gap-3">
          <DictCard 
            title="retrognathia" 
            badge="Important OSA" 
            type="Boolean" 
            desc="Retrognatism - mandibulă retractivă care îngustează căile aeriene superioare." 
            example="true" 
            canModify
            nullAllowed
            searchQuery={searchQuery}
          />
          <DictCard 
            title="nasalObstruction" 
            badge="Important OSA" 
            type="Boolean" 
            desc="Obstrucție nazală cronică care favorizează respirația orală și colapsul faringian." 
            example="true" 
            canModify
            nullAllowed
            searchQuery={searchQuery}
          />
          <DictCard 
            title="chronicRhinitis" 
            type="Boolean" 
            desc="Rinită cronică (alergică sau non-alergică) care afectează permeabilitatea nazală." 
            example="false" 
            canModify
            nullAllowed
            searchQuery={searchQuery}
          />
          <DictCard 
            title="priorENTSurgery" 
            type="Boolean" 
            desc="Istoric de chirurgie ORL (adenoidectomie, tonsilectomie, septoplastie, UPPP)." 
            example="false" 
            canModify
            nullAllowed
            searchQuery={searchQuery}
          />
        </div>

        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-[#0d9488]">11. Risc Rutier & Siguranță</h2>
        <div className="mb-6 flex flex-col gap-3">
          <DictCard 
            title="isProfessionalDriver" 
            badge="Sensibil GDPR" 
            type="Boolean" 
            desc="Indică dacă pacientul este șofer profesionist (camion, taxi, transport public). RISC LEGAL MAJOR!" 
            example="true" 
            canModify
            nullAllowed
            searchQuery={searchQuery}
          />
          <DictCard 
            title="drowsyDriving" 
            badge="Sensibil GDPR" 
            type="Boolean" 
            desc="Istoric de adormire la volan sau somnolență excesivă în timpul conducerii. RISC MAJOR!" 
            example="true" 
            canModify
            searchQuery={searchQuery}
          />
          <DictCard 
            title="drowsinessFrequency" 
            type="Enum" 
            desc="Frecvența episoadelor de somnolență la volan." 
            example="Săptămânal" 
            range="Rar | Lunar | Săptămânal | Zilnic"
            canModify
            nullAllowed
            searchQuery={searchQuery}
          />
          <DictCard 
            title="roadAccidents" 
            badge="Numeric" 
            type="Integer" 
            desc="Numărul de accidente rutiere potențial legate de somnolență." 
            example="1" 
            unit="accidente"
            canModify
            nullAllowed
            searchQuery={searchQuery}
          />
          <DictCard 
            title="shiftWorkHours" 
            badge="Numeric" 
            type="Integer" 
            desc="Ore de lucru în ture/schimburi pe săptămână care afectează ritmul circadian." 
            example="40" 
            unit="ore/săptămână"
            canModify
            nullAllowed
            searchQuery={searchQuery}
          />
          <DictCard 
            title="drivingResumedAfterTreatment" 
            badge="Sensibil GDPR" 
            type="Enum" 
            desc="Dacă și când pacientul a reluat conducerea după inițierea tratamentului CPAP. IMPORTANT LEGAL!" 
            example="După 3 luni tratament" 
            range="Nu conduce | Sub tratament, fără permis | După 3 luni tratament | După 6 luni tratament | Permis medical obținut"
            canModify
            nullAllowed
            searchQuery={searchQuery}
          />
        </div>

        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-[#0d9488]">12. Factori Psihosociali Extinși</h2>
        <div className="mb-6 flex flex-col gap-3">
          <DictCard 
            title="socialSupport" 
            type="Enum" 
            desc="Nivelul de suport social perceput - influențează aderența la tratament." 
            example="Mediu" 
            range="Scăzut | Mediu | Ridicat"
            canModify
            nullAllowed
            searchQuery={searchQuery}
          />
          <DictCard 
            title="chronicStress" 
            type="Boolean" 
            desc="Stres cronic semnificativ care poate afecta calitatea somnului." 
            example="true" 
            canModify
            nullAllowed
            searchQuery={searchQuery}
          />
          <DictCard 
            title="treatmentSatisfaction" 
            type="Enum" 
            desc="Satisfacția pacientului față de tratamentul curent." 
            example="Mulțumit" 
            range="Nemulțumit | Neutru | Mulțumit | Foarte mulțumit"
            canModify
            nullAllowed
            searchQuery={searchQuery}
          />
          <DictCard 
            title="treatmentMotivation" 
            type="Enum" 
            desc="Motivația pacientului pentru aderență la tratament CPAP." 
            example="Ridicată" 
            range="Scăzută | Medie | Ridicată"
            canModify
            nullAllowed
            searchQuery={searchQuery}
          />
        </div>

        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-[#0d9488]">13. Metrici Somn (Vizite)</h2>
        <div className="mb-6 flex flex-col gap-3">
          <DictCard 
            title="ahi" 
            badge="Metrică Primară" 
            type="Decimal" 
            desc="Indicele Apnee-Hipopnee - numărul mediu de evenimente respiratorii pe oră de somn. METRICA PRINCIPALĂ OSA." 
            example="32.5" 
            unit="evenimente/oră" 
            range="<5: Normal | 5-15: OSA Ușor | 15-30: OSA Moderat | ≥30: OSA Sever" 
            canModify
            searchQuery={searchQuery}
          />
          <DictCard 
            title="ahiResidual" 
            badge="Important OSA" 
            type="Decimal" 
            desc="IAH rezidual sub tratament CPAP. Indică eficacitatea tratamentului." 
            example="1.8" 
            unit="evenimente/oră" 
            range="<5: Control bun | 5-10: Suboptimal | >10: Control inadecvat"
            canModify
            searchQuery={searchQuery}
          />
          <DictCard 
            title="desatIndex" 
            badge="Numeric" 
            type="Decimal" 
            desc="Indexul de desaturare în oxigen - număr de scăderi SpO2 ≥4% per oră." 
            example="6.3" 
            unit="evenimente/oră"
            canModify
            searchQuery={searchQuery}
          />
          <DictCard 
            title="ahiNrem" 
            type="Decimal" 
            desc="IAH în somnul NREM (Non-REM)." 
            example="7.7" 
            unit="evenimente/oră"
            canModify
            searchQuery={searchQuery}
          />
          <DictCard 
            title="ahiRem" 
            type="Decimal" 
            desc="IAH în somnul REM. De obicei mai crescut decât NREM." 
            example="11.8" 
            unit="evenimente/oră"
            canModify
            searchQuery={searchQuery}
          />
        </div>

        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-[#0d9488]">14. Saturație Oxigen</h2>
        <div className="mb-6 flex flex-col gap-3">
          <DictCard 
            title="spo2Min" 
            badge="Numeric" 
            type="Integer (0-100)" 
            desc="Saturația minimă de oxigen în timpul somnului." 
            example="89" 
            unit="%"
            range="Normal: ≥90% | Hipoxemie: <90%"
            canModify
            searchQuery={searchQuery}
          />
          <DictCard 
            title="spo2Max" 
            badge="Numeric" 
            type="Integer (0-100)" 
            desc="Saturația maximă de oxigen în timpul somnului." 
            example="98" 
            unit="%"
            canModify
            searchQuery={searchQuery}
          />
          <DictCard 
            title="spo2Mean" 
            badge="Numeric" 
            type="Decimal" 
            desc="Saturația medie de oxigen în timpul somnului." 
            example="93" 
            unit="%"
            range="Normal: ≥92%"
            canModify
            searchQuery={searchQuery}
          />
          <DictCard 
            title="meanDesaturations" 
            badge="Numeric" 
            type="Decimal" 
            desc="Numărul mediu de desaturări (scăderi SpO2 ≥3%) per oră de somn." 
            example="3.2" 
            unit="evenimente/oră"
            canModify
            searchQuery={searchQuery}
          />
          <DictCard 
            title="t90" 
            badge="Important OSA" 
            type="Decimal" 
            desc="Procentul timpului cu SpO2 <90% (T90). Indicator de severitate hipoxemie." 
            example="1.4" 
            unit="% din timp"
            range="<1%: Normal | 1-10%: Moderat | >10%: Sever"
            canModify
            searchQuery={searchQuery}
          />
          <DictCard 
            title="t45" 
            type="Decimal" 
            desc="Procentul timpului cu SpO2 <45%. Hipoxemie severă." 
            example="0.18" 
            unit="% din timp"
            range="Orice valoare >0 este îngrijorătoare"
            canModify
            searchQuery={searchQuery}
          />
          <DictCard 
            title="povaraHipoxica" 
            badge="Important OSA" 
            type="Decimal" 
            desc="Povara hipoxică - măsură a severității și duratei desaturărilor de oxigen. Calculată ca produs între adâncimea și durata desaturărilor." 
            example="124.5" 
            unit="%.min"
            range="Scor mai mare = hipoxemie mai severă"
            canModify
            searchQuery={searchQuery}
          />
        </div>

        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-[#0d9488]">15. Complianță CPAP</h2>
        <div className="mb-6 flex flex-col gap-3">
          <DictCard 
            title="cpapCompliancePct" 
            badge="KPI Principal" 
            type="Percentage (0-100)" 
            desc="Procentul nopților cu utilizare CPAP >4 ore din totalul nopților. KPI PRINCIPAL pentru monitorizare." 
            example="78" 
            unit="%" 
            range="≥70%: Compliant | <70%: Non-compliant (necesită intervenție)" 
            canModify
            searchQuery={searchQuery}
          />
          <DictCard 
            title="cpapCompliance4hPct" 
            type="Percentage (0-100)" 
            desc="Procentul nopților cu utilizare ≥4 ore (alternativă la cpapCompliancePct)." 
            example="89" 
            unit="%"
            canModify
            searchQuery={searchQuery}
          />
          <DictCard 
            title="cpapUsageMin" 
            badge="Numeric" 
            type="Integer" 
            desc="Utilizare medie CPAP pe noapte în minute." 
            example="522" 
            unit="minute/noapte"
            range="≥240 min (4h): Compliant"
            canModify
            searchQuery={searchQuery}
          />
          <DictCard 
            title="cpapLeaks95p" 
            badge="Numeric" 
            type="Decimal" 
            desc="Scurgeri măști la percentila 95 - indică calitatea sigiliului măștii." 
            example="13.8" 
            unit="L/min"
            range="<24 L/min: Acceptabil | ≥24: Scurgeri excesive (necesită ajustare)"
            canModify
            searchQuery={searchQuery}
          />
          <DictCard 
            title="cpapPressure95p" 
            badge="Numeric" 
            type="Decimal" 
            desc="Presiunea CPAP la percentila 95 - presiunea efectivă aplicată." 
            example="11.6" 
            unit="cmH2O"
            canModify
            searchQuery={searchQuery}
          />
        </div>

        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-[#0d9488]">16. Dispozitiv & Mască CPAP</h2>
        <div className="mb-6 flex flex-col gap-3">
          <DictCard 
            title="cpapData.brand" 
            type="String" 
            desc="Producător dispozitiv CPAP." 
            example="ResMed" 
            range="ResMed | Philips | Fisher & Paykel | BMC | Löwenstein | Altele"
            canModify
            searchQuery={searchQuery}
          />
          <DictCard 
            title="cpapData.model" 
            type="String" 
            desc="Modelul specific al dispozitivului CPAP." 
            example="AirSense 10 AutoSet" 
            canModify
            searchQuery={searchQuery}
          />
          <DictCard 
            title="cpapData.therapyType" 
            type="Enum" 
            desc="Tipul de terapie presională." 
            example="APAP" 
            range="CPAP (presiune fixă) | APAP (presiune auto-ajustabilă) | BiPAP (2 nivele) | ASV (servo-ventilație)"
            canModify
            searchQuery={searchQuery}
          />
          <DictCard 
            title="cpapData.pressureMin" 
            badge="Numeric" 
            type="Integer" 
            desc="Presiunea minimă setată (pentru APAP/BiPAP)." 
            example="8" 
            unit="cmH2O"
            range="4-20 cmH2O"
            canModify
            searchQuery={searchQuery}
          />
          <DictCard 
            title="cpapData.pressureMax" 
            badge="Numeric" 
            type="Integer" 
            desc="Presiunea maximă setată (pentru APAP/BiPAP)." 
            example="14" 
            unit="cmH2O"
            range="4-25 cmH2O"
            canModify
            searchQuery={searchQuery}
          />
          <DictCard 
            title="cpapData.humidificationEnabled" 
            type="Boolean" 
            desc="Dacă funcția de umidificare este activată pe dispozitiv." 
            example="true" 
            canModify
            searchQuery={searchQuery}
          />
          <DictCard 
            title="cpapData.humidificationLevel" 
            badge="Numeric" 
            type="Integer (1-5)" 
            desc="Nivelul de umidificare setat (afișat doar dacă humidificationEnabled=true)." 
            example="3" 
            range="1: Minim | 5: Maxim"
            canModify
            nullAllowed
            searchQuery={searchQuery}
          />
          <DictCard 
            title="cpapData.rampEnabled" 
            type="Boolean" 
            desc="Dacă funcția de rampă (creștere treptată a presiunii) este activată." 
            example="true" 
            canModify
            searchQuery={searchQuery}
          />
          <DictCard 
            title="cpapData.rampTime" 
            badge="Numeric" 
            type="Integer" 
            desc="Durata rampei de presiune în minute (afișat doar dacă rampEnabled=true)." 
            example="20" 
            unit="minute"
            range="5-45 minute"
            canModify
            nullAllowed
            searchQuery={searchQuery}
          />
          <DictCard 
            title="maskType" 
            type="Enum" 
            desc="Tipul de mască CPAP folosită." 
            example="Nazală" 
            range="Nazală | Oronazală | Pillows (perne nazale) | Facială completă"
            canModify
            searchQuery={searchQuery}
          />
          <DictCard 
            title="maskFitGood" 
            type="Boolean" 
            desc="Dacă masca se potrivește corect (fără scurgeri semnificative)." 
            example="true" 
            canModify
            searchQuery={searchQuery}
          />
          <DictCard 
            title="maskChange" 
            type="Boolean" 
            desc="Dacă masca a fost schimbată la această vizită." 
            example="false" 
            canModify
            searchQuery={searchQuery}
          />
        </div>

        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-[#0d9488]">16b. CPAP - Probleme Tehnice</h2>
        <div className="mb-6 flex flex-col gap-3">
          <DictCard 
            title="cpapData.technicalProblems.facialIrritation" 
            type="Boolean" 
            desc="Iritație facială cauzată de mască (presiune, frecare)." 
            example="true" 
            canModify
            nullAllowed
            searchQuery={searchQuery}
          />
          <DictCard 
            title="cpapData.technicalProblems.claustrophobia" 
            type="Boolean" 
            desc="Senzație de claustrofobie cu masca pe față." 
            example="false" 
            canModify
            nullAllowed
            searchQuery={searchQuery}
          />
          <DictCard 
            title="cpapData.technicalProblems.deviceNoise" 
            type="Boolean" 
            desc="Zgomot deranjant al dispozitivului CPAP." 
            example="false" 
            canModify
            nullAllowed
            searchQuery={searchQuery}
          />
          <DictCard 
            title="cpapData.technicalProblems.nasalSecretions" 
            type="Boolean" 
            desc="Secreții nazale excesive, rinită indusă de CPAP." 
            example="true" 
            canModify
            nullAllowed
            searchQuery={searchQuery}
          />
          <DictCard 
            title="cpapData.technicalProblems.aerophagia" 
            type="Boolean" 
            desc="Aerofagie (înghițire de aer) cauzată de presiune CPAP ridicată." 
            example="false" 
            canModify
            nullAllowed
            searchQuery={searchQuery}
          />
          <DictCard 
            title="cpapData.technicalProblems.otherIssues" 
            type="String" 
            desc="Alte probleme tehnice nespecificate." 
            example="Scurgeri de aer pe gură" 
            canModify
            nullAllowed
            searchQuery={searchQuery}
          />
        </div>

        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-[#0d9488]">16c. CPAP - Motive Neaderență</h2>
        <div className="mb-6 flex flex-col gap-3">
          <DictCard 
            title="cpapData.nonAdherenceReasons.dryness" 
            type="Boolean" 
            desc="Uscăciune nazală/bucală care reduce aderența la CPAP." 
            example="true" 
            canModify
            nullAllowed
            searchQuery={searchQuery}
          />
          <DictCard 
            title="cpapData.nonAdherenceReasons.pressureTooHigh" 
            type="Boolean" 
            desc="Presiunea percepută ca prea ridicată sau incomodă." 
            example="true" 
            canModify
            nullAllowed
            searchQuery={searchQuery}
          />
          <DictCard 
            title="cpapData.nonAdherenceReasons.anxiety" 
            type="Boolean" 
            desc="Anxietate legată de utilizarea dispozitivului CPAP." 
            example="false" 
            canModify
            nullAllowed
            searchQuery={searchQuery}
          />
          <DictCard 
            title="cpapData.nonAdherenceReasons.other" 
            type="String" 
            desc="Alte motive de neaderență la tratamentul CPAP." 
            example="Interferență cu partenerul" 
            canModify
            nullAllowed
            searchQuery={searchQuery}
          />
        </div>

        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-[#0d9488]">17. Comorbidități (ICD-10)</h2>
        <div className="mb-6 flex flex-col gap-3">
          <DictCard 
            title="comorbidities.cardiovascular" 
            type="Array[String]" 
            desc="Coduri ICD-10 pentru comorbidități cardiovasculare." 
            example="['I10', 'I25.1', 'I48']" 
            range="I10: HTA | I15.0: HTA rezistentă | I25.1: Boală coronariană | I48: Fibrilație atrială | I50.9: Insuficiență cardiacă"
            canModify
            searchQuery={searchQuery}
          />
          <DictCard 
            title="comorbidities.metabolic" 
            type="Array[String]" 
            desc="Coduri ICD-10 pentru comorbidități metabolice." 
            example="['E11.9', 'E66.9']" 
            range="E11.9: Diabet tip 2 | E66.9: Obezitate | E66.01: Obezitate cu istoric chirurgie bariatrică | E78.5: Dislipidemie"
            canModify
            searchQuery={searchQuery}
          />
          <DictCard 
            title="comorbidities.respiratory" 
            type="Array[String]" 
            desc="Coduri ICD-10 pentru comorbidități respiratorii." 
            example="['J45.9', 'J44.9']" 
            range="J45.9: Astm | J44.9: BPOC | J30.4: Rinită alergică | J84.9: Boală pulmonară restrictivă"
            canModify
            searchQuery={searchQuery}
          />
          <DictCard 
            title="comorbidities.neurologic" 
            type="Array[String]" 
            desc="Coduri ICD-10 pentru comorbidități neurologice/psihiatrice." 
            example="['F41.9', 'F32.9']" 
            range="G47.31: OSA | F41.9: Anxietate | F32.9: Depresie | F03: Tulburări cognitive | G43.9: Migrenă"
            canModify
            searchQuery={searchQuery}
          />
          <DictCard 
            title="comorbidities.other" 
            type="Array[String]" 
            desc="Alte comorbidități semnificative." 
            example="['K21.9', 'N18.9']" 
            range="K21.9: Reflux gastroesofagian | E03.9: Hipotiroidism | I26.9: Tromboembolism | N18.9: Insuficiență renală cronică | M79.7: Fibromialgie"
            canModify
            searchQuery={searchQuery}
          />
        </div>

        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-[#0d9488]">18. Informații Administrative</h2>
        <div className="mb-6 flex flex-col gap-3">
          <DictCard 
            title="status" 
            type="Enum" 
            desc="Statusul activ al pacientului în sistem." 
            example="Active" 
            range="Active: Pacient activ | Inactive: Încetat tratament | Deceased: Decedat"
            canModify
            searchQuery={searchQuery}
          />
          <DictCard 
            title="assignedDoctorId" 
            type="UUID (FK → Users)" 
            desc="Medicul responsabil alocat pacientului." 
            example="doctor-uuid-here" 
            canModify
            searchQuery={searchQuery}
          />
          <DictCard 
            title="createdAt" 
            type="Timestamp" 
            desc="Data și ora creării înregistrării în sistem." 
            example="2024-08-15 10:30:00" 
            canModify={false}
            searchQuery={searchQuery}
          />
          <DictCard 
            title="updatedAt" 
            type="Timestamp" 
            desc="Data și ora ultimei modificări." 
            example="2024-12-10 14:45:00" 
            canModify={false}
            searchQuery={searchQuery}
          />
          <DictCard 
            title="lastVisit" 
            type="Date" 
            desc="Data ultimei vizite medicale înregistrate (actualizată automat)." 
            example="2024-12-05" 
            canModify={false}
            derived="MAX(visits.visitDate)"
            searchQuery={searchQuery}
          />
        </div>
      </main>
    </div>
  );
};

export default DataDictionary;
