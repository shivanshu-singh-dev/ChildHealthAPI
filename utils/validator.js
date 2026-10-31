/**
 * Validation utilities for requests and date formats
 */

/**
 * Validates that a string is a valid calendar date in YYYY-MM-DD format.
 * @param {string} dateStr 
 * @returns {boolean}
 */
function isValidDateFormat(dateStr) {
  if (typeof dateStr !== 'string') return false;

  // Check strict YYYY-MM-DD format
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;

  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  // JavaScript months are 0-indexed (0 = January, 11 = December)
  if (month < 1 || month > 12) return false;

  const date = new Date(year, month - 1, day);

  // Check if calendar date matches input (handles invalid days like Feb 30)
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

/**
 * Checks whether a date string is not set in the future.
 * @param {string} dateStr 
 * @returns {boolean}
 */
function isDateNotInFuture(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const now = new Date();
  
  // Set to end of today to allow registering children born today
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  return date <= endOfToday;
}

/**
 * Validates child registration payload
 * Required fields: name, dateOfBirth, guardianName, state, consentStatus
 * @param {object} data 
 * @returns {{ isValid: boolean, errors: string[] }}
 */
function validateChildRegistration(data) {
  const errors = [];

  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Request body must be a JSON object'] };
  }

  // Name validation
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    errors.push("'name' is required and must be a non-empty string");
  }

  // Date of birth validation
  if (!data.dateOfBirth || typeof data.dateOfBirth !== 'string') {
    errors.push("'dateOfBirth' is required in YYYY-MM-DD format");
  } else if (!isValidDateFormat(data.dateOfBirth)) {
    errors.push("'dateOfBirth' must be a valid calendar date in YYYY-MM-DD format (e.g., '2023-08-15')");
  } else if (!isDateNotInFuture(data.dateOfBirth)) {
    errors.push("'dateOfBirth' cannot be a future date");
  }

  // Guardian name validation
  if (!data.guardianName || typeof data.guardianName !== 'string' || data.guardianName.trim().length === 0) {
    errors.push("'guardianName' is required and must be a non-empty string");
  }

  // State validation
  if (!data.state || typeof data.state !== 'string' || data.state.trim().length === 0) {
    errors.push("'state' is required and must be a non-empty string");
  }

  // Consent status validation
  if (data.consentStatus === undefined || data.consentStatus === null) {
    errors.push("'consentStatus' is required (e.g., true, false, 'granted', 'pending')");
  } else if (
    typeof data.consentStatus !== 'boolean' &&
    (typeof data.consentStatus !== 'string' || data.consentStatus.trim().length === 0)
  ) {
    errors.push("'consentStatus' must be a boolean or a non-empty string");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates reminder creation payload
 * Required fields: childId, vaccineName, dueDate, status
 * @param {object} data 
 * @returns {{ isValid: boolean, errors: string[] }}
 */
function validateReminderCreation(data) {
  const errors = [];

  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Request body must be a JSON object'] };
  }

  // childId validation
  if (!data.childId || typeof data.childId !== 'string' || data.childId.trim().length === 0) {
    errors.push("'childId' is required and must be a non-empty string");
  }

  // vaccineName validation
  if (!data.vaccineName || typeof data.vaccineName !== 'string' || data.vaccineName.trim().length === 0) {
    errors.push("'vaccineName' is required and must be a non-empty string");
  }

  // dueDate validation
  if (!data.dueDate || typeof data.dueDate !== 'string') {
    errors.push("'dueDate' is required in YYYY-MM-DD format");
  } else if (!isValidDateFormat(data.dueDate)) {
    errors.push("'dueDate' must be a valid calendar date in YYYY-MM-DD format (e.g., '2024-10-20')");
  }

  // status validation
  if (!data.status || typeof data.status !== 'string' || data.status.trim().length === 0) {
    errors.push("'status' is required and must be a non-empty string (e.g., 'scheduled', 'pending', 'completed')");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  isValidDateFormat,
  isDateNotInFuture,
  validateChildRegistration,
  validateReminderCreation
};
