/**
 * Extrage informații din CNP-ul românesc
 * Format: SSYYMMDDCCCCNNC
 * SS = sex + criteriu
 * YYMMDD = data nașterii
 * CC = county code
 * NNN = numere de ordine
 * C = cifra de control
 */

export const extractInfoFromCNP = (cnp) => {
  if (!cnp || cnp.length !== 13 || !/^\d{13}$/.test(cnp)) {
    return null;
  }

  try {
    // Extrage data nașterii (YYMMDD)
    // Format: SSYYMMDDCCCCNNC (13 cifre)
    // S=sex (pos 0), YY=year (pos 1-2), MM=month (pos 3-4), DD=day (pos 5-6)
    
    const yearStr = cnp.substring(1, 3);
    const monthStr = cnp.substring(3, 5);
    const dayStr = cnp.substring(5, 7);

    console.log('CNP parsing:', { cnp, yearStr, monthStr, dayStr });

    // Determină secolul
    const sexDigit = parseInt(cnp.substring(0, 1));
    let year;
    
    if (sexDigit === 1 || sexDigit === 2) {
      // secolul 19
      year = 1900 + parseInt(yearStr);
    } else if (sexDigit === 3 || sexDigit === 4) {
      // secolul 18
      year = 1800 + parseInt(yearStr);
    } else if (sexDigit === 5 || sexDigit === 6) {
      // secolul 20
      year = 2000 + parseInt(yearStr);
    } else if (sexDigit === 7 || sexDigit === 8 || sexDigit === 9) {
      // străini
      year = 1900 + parseInt(yearStr);
    } else {
      return null;
    }

    const month = parseInt(monthStr);
    const day = parseInt(dayStr);

    console.log('Extracted values:', { year, month, day });

    // Validare bază
    if (month < 1 || month > 12 || day < 1 || day > 31) {
      return null;
    }

    // Construiește data
    const birthDate = new Date(year, month - 1, day);
    
    // Validează data (de ex. februarie 30)
    if (birthDate.getMonth() !== month - 1 || birthDate.getDate() !== day) {
      return null;
    }

    // Calculează vârsta
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    // Determină sexul
    let sex = null;
    if (sexDigit === 1 || sexDigit === 5 || sexDigit === 7) {
      sex = 'M'; // Masculin
    } else if (sexDigit === 2 || sexDigit === 4 || sexDigit === 6 || sexDigit === 8 || sexDigit === 9) {
      sex = 'F'; // Feminin
    }

    // Extrage codul județului
    const countyCode = cnp.substring(7, 9);

    // Mapping coduri județe (conform Wikipedia)
    const countyMap = {
      '01': 'Alba', '02': 'Arad', '03': 'Argeș', '04': 'Bacău', '05': 'Bihor',
      '06': 'Bistrița-Năsăud', '07': 'Botoșani', '08': 'Brașov', '09': 'Brăila',
      '10': 'Buzău', '11': 'Caraș-Severin', '12': 'Cluj', '13': 'Constanța',
      '14': 'Covasna', '15': 'Dâmbovița', '16': 'Dolj', '17': 'Galați',
      '18': 'Gorj', '19': 'Harghita', '20': 'Hunedoara', '21': 'Ialomița',
      '22': 'Iași', '23': 'Ilfov', '24': 'Maramureș', '25': 'Mehedinți',
      '26': 'Mureș', '27': 'Neamț', '28': 'Olt', '29': 'Prahova',
      '30': 'Satu Mare', '31': 'Sălaj', '32': 'Sibiu', '33': 'Suceava',
      '34': 'Teleorman', '35': 'Timiș', '36': 'Tulcea', '37': 'Vaslui',
      '38': 'Vâlcea', '39': 'Vrancea', '40': 'București',
      '41': 'București S.1', '42': 'București S.2', '43': 'București S.3',
      '44': 'București S.4', '45': 'București S.5', '46': 'București S.6',
      '51': 'Călărași', '52': 'Giurgiu'
    };

    const county = countyMap[countyCode] || null;

    // Formatează data fără conversie timezone
    const monthFormatted = String(month).padStart(2, '0');
    const dayFormatted = String(day).padStart(2, '0');
    const birthDateString = `${year}-${monthFormatted}-${dayFormatted}`;

    return {
      birthDate: birthDateString, // YYYY-MM-DD
      age,
      sex,
      county,
      countyCode,
      valid: true
    };
  } catch (error) {
    console.error('Eroare la parsarea CNP:', error);
    return null;
  }
};

/**
 * Validează CNP-ul românesc
 */
export const validateCNP = (cnp) => {
  if (!cnp || cnp.length !== 13 || !/^\d{13}$/.test(cnp)) {
    return false;
  }

  // Validare cifra de control
  const controlKey = '279146358279';
  let sum = 0;
  
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cnp[i]) * parseInt(controlKey[i]);
  }
  
  const controlDigit = sum % 11;
  const expectedControl = controlDigit === 10 ? 1 : controlDigit;
  
  return parseInt(cnp[12]) === expectedControl && extractInfoFromCNP(cnp) !== null;
};

export default { extractInfoFromCNP, validateCNP };
