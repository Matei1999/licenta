// utils/dateUtils.js
import { format, parseISO } from 'date-fns';
import { ro } from 'date-fns/locale';

/**
 * Format date to Romanian locale (DD.MM.YYYY)
 * @param {string|Date} date - ISO date string or Date object
 * @param {string} formatStr - format string (default: 'dd.MM.yyyy')
 * @returns {string}
 */
export const formatDateRo = (date, formatStr = 'dd.MM.yyyy') => {
  if (!date) return '';
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, formatStr, { locale: ro });
  } catch (err) {
    console.error('Error formatting date:', err);
    return '';
  }
};

/**
 * Format date with time to Romanian locale (DD.MM.YYYY HH:mm)
 * @param {string|Date} date - ISO date string or Date object
 * @returns {string}
 */
export const formatDateTimeRo = (date) => {
  return formatDateRo(date, 'dd.MM.yyyy HH:mm');
};

/**
 * Format full date text to Romanian (e.g., "26 decembrie 2025")
 * @param {string|Date} date - ISO date string or Date object
 * @returns {string}
 */
export const formatDateFullRo = (date) => {
  return formatDateRo(date, 'd MMMM yyyy');
};

/**
 * Convert date input value (YYYY-MM-DD) to Romanian format
 * @param {string} dateString - ISO date string (YYYY-MM-DD)
 * @returns {string}
 */
export const convertDateToRomanianFormat = (dateString) => {
  if (!dateString) return '';
  return formatDateRo(dateString, 'dd.MM.yyyy');
};
