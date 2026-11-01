const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ALLOWED_REMINDER_STATUSES = new Set([
  'scheduled',
  'completed',
  'pending',
  'cancelled',
  'overdue'
]);

const ALLOWED_CONSENT_STRINGS = new Set([
  'granted',
  'denied',
  'pending',
  'revoked'
]);

/**
 * Validates whether a value is a non-empty string after trimming
 * @param {any} value 
 * @returns {boolean}
 */
function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Validates a valid UUID string
 * @param {string} id 
 * @returns {boolean}
 */
function isValidUUID(id) {
  if (typeof id !== 'string') return false;
  return UUID_REGEX.test(id.trim());
}

/**
 * Validates calendar date in YYYY-MM-DD format
 * @param {string} dateStr 
 * @returns {boolean}
 */
function isValidDateFormat(dateStr) {
  if (typeof dateStr !== 'string') return false;
  if (!DATE_REGEX.test(dateStr)) return false;

  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  if (month < 1 || month > 12) return false;

  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

/**
 * Checks whether a date string is not in the future
 * @param {string} dateStr 
 * @returns {boolean}
 */
function isDateNotInFuture(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const now = new Date();
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  return date <= endOfToday;
}

/**
 * Validates consent status value
 * Accepts booleans (true/false) or allowed strings ('granted', 'denied', 'pending', 'revoked')
 * @param {any} val 
 * @returns {boolean}
 */
function isValidConsentStatus(val) {
  if (typeof val === 'boolean') return true;
  if (typeof val === 'string' && ALLOWED_CONSENT_STRINGS.has(val.trim().toLowerCase())) return true;
  return false;
}

/**
 * Normalizes consent status to standardized lowercase string
 * @param {any} val 
 * @returns {string|null}
 */
function normalizeConsentStatus(val) {
  if (typeof val === 'boolean') {
    return val ? 'granted' : 'denied';
  }
  if (typeof val === 'string' && ALLOWED_CONSENT_STRINGS.has(val.trim().toLowerCase())) {
    return val.trim().toLowerCase();
  }
  return null;
}

/**
 * Validates reminder status string
 * @param {any} val 
 * @returns {boolean}
 */
function isValidReminderStatus(val) {
  if (typeof val !== 'string') return false;
  return ALLOWED_REMINDER_STATUSES.has(val.trim().toLowerCase());
}

/**
 * Validates child registration payload
 * @param {object} data 
 * @returns {{ isValid: boolean, errors: string[], normalizedConsent?: string }}
 */
function validateChildRegistration(data) {
  const errors = [];

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { isValid: false, errors: ['Request body must be a valid JSON object'] };
  }

  // Name validation
  if (!('name' in data)) {
    errors.push("'name' is required");
  } else if (!isNonEmptyString(data.name)) {
    errors.push("'name' cannot be empty or blank");
  } else if (data.name.trim().length < 2 || data.name.trim().length > 100) {
    errors.push("'name' must be between 2 and 100 characters");
  }

  // Date of Birth validation
  if (!('dateOfBirth' in data)) {
    errors.push("'dateOfBirth' is required in YYYY-MM-DD format");
  } else if (!isNonEmptyString(data.dateOfBirth)) {
    errors.push("'dateOfBirth' cannot be empty");
  } else if (!isValidDateFormat(data.dateOfBirth)) {
    errors.push("'dateOfBirth' must be a valid calendar date in YYYY-MM-DD format (e.g. 2023-08-15)");
  } else if (!isDateNotInFuture(data.dateOfBirth)) {
    errors.push("'dateOfBirth' cannot be a future date");
  }

  // Guardian Name validation
  if (!('guardianName' in data)) {
    errors.push("'guardianName' is required");
  } else if (!isNonEmptyString(data.guardianName)) {
    errors.push("'guardianName' cannot be empty or blank");
  } else if (data.guardianName.trim().length < 2 || data.guardianName.trim().length > 100) {
    errors.push("'guardianName' must be between 2 and 100 characters");
  }

  // State validation
  if (!('state' in data)) {
    errors.push("'state' is required");
  } else if (!isNonEmptyString(data.state)) {
    errors.push("'state' cannot be empty or blank");
  } else if (data.state.trim().length < 2 || data.state.trim().length > 50) {
    errors.push("'state' must be between 2 and 50 characters");
  }

  // Consent Status validation
  let normalizedConsent = null;
  if (!('consentStatus' in data) || data.consentStatus === null || data.consentStatus === undefined) {
    errors.push("'consentStatus' is required");
  } else if (!isValidConsentStatus(data.consentStatus)) {
    errors.push("'consentStatus' must be a boolean (true/false) or one of: 'granted', 'denied', 'pending', 'revoked'");
  } else {
    normalizedConsent = normalizeConsentStatus(data.consentStatus);
  }

  return {
    isValid: errors.length === 0,
    errors,
    normalizedConsent
  };
}

/**
 * Validates reminder creation payload
 * @param {object} data 
 * @returns {{ isValid: boolean, errors: string[] }}
 */
function validateReminderCreation(data) {
  const errors = [];

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { isValid: false, errors: ['Request body must be a valid JSON object'] };
  }

  // childId validation
  if (!('childId' in data)) {
    errors.push("'childId' is required");
  } else if (!isNonEmptyString(data.childId)) {
    errors.push("'childId' cannot be empty or blank");
  } else if (!isValidUUID(data.childId)) {
    errors.push("'childId' must be a valid UUID format");
  }

  // vaccineName validation
  if (!('vaccineName' in data)) {
    errors.push("'vaccineName' is required");
  } else if (!isNonEmptyString(data.vaccineName)) {
    errors.push("'vaccineName' cannot be empty or blank");
  } else if (data.vaccineName.trim().length < 2 || data.vaccineName.trim().length > 100) {
    errors.push("'vaccineName' must be between 2 and 100 characters");
  }

  // dueDate validation
  if (!('dueDate' in data)) {
    errors.push("'dueDate' is required in YYYY-MM-DD format");
  } else if (!isNonEmptyString(data.dueDate)) {
    errors.push("'dueDate' cannot be empty");
  } else if (!isValidDateFormat(data.dueDate)) {
    errors.push("'dueDate' must be a valid calendar date in YYYY-MM-DD format (e.g. 2026-11-20)");
  }

  // status validation
  if (!('status' in data)) {
    errors.push("'status' is required");
  } else if (!isNonEmptyString(data.status)) {
    errors.push("'status' cannot be empty or blank");
  } else if (!isValidReminderStatus(data.status)) {
    errors.push("'status' must be one of: 'scheduled', 'completed', 'pending', 'cancelled', 'overdue'");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates URL ID parameter
 * @param {string} id 
 * @returns {{ isValid: boolean, error?: string }}
 */
function validateIdParam(id) {
  if (!id || typeof id !== 'string' || id.trim().length === 0) {
    return { isValid: false, error: 'ID parameter cannot be empty' };
  }
  if (!isValidUUID(id)) {
    return { isValid: false, error: 'Child ID must be a valid UUID' };
  }
  return { isValid: true };
}

/**
 * Validates guardian registration payload
 * @param {object} data 
 * @returns {{ isValid: boolean, errors: string[] }}
 */
function validateRegister(data) {
  const errors = [];

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { isValid: false, errors: ['Request body must be a valid JSON object'] };
  }

  // Name
  if (!('name' in data) || !isNonEmptyString(data.name)) {
    errors.push("'name' is required and cannot be empty");
  } else if (data.name.trim().length < 2 || data.name.trim().length > 100) {
    errors.push("'name' must be between 2 and 100 characters");
  }

  // Email
  if (!('email' in data) || !isNonEmptyString(data.email)) {
    errors.push("'email' is required");
  } else if (!EMAIL_REGEX.test(data.email.trim())) {
    errors.push("'email' must be a valid email address");
  }

  // Password
  if (!('password' in data) || typeof data.password !== 'string' || data.password.length === 0) {
    errors.push("'password' is required");
  } else if (data.password.length < 5) {
    errors.push("'password' must be at least 5 characters long");
  } else if (Buffer.byteLength(data.password, 'utf8') > 72) {
    errors.push("'password' cannot exceed 72 bytes (bcrypt input limitation)");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates login payload
 * @param {object} data 
 * @returns {{ isValid: boolean, errors: string[] }}
 */
function validateLogin(data) {
  const errors = [];

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { isValid: false, errors: ['Request body must be a valid JSON object'] };
  }

  const identifier = data.email || data.username;
  if (!identifier || typeof identifier !== 'string' || identifier.trim().length === 0) {
    errors.push("'email' or 'username' is required");
  }

  if (!('password' in data) || typeof data.password !== 'string' || data.password.length === 0) {
    errors.push("'password' is required");
  } else if (Buffer.byteLength(data.password, 'utf8') > 72) {
    errors.push("'password' cannot exceed 72 bytes");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  isValidUUID,
  isValidDateFormat,
  isDateNotInFuture,
  isValidConsentStatus,
  normalizeConsentStatus,
  isValidReminderStatus,
  validateChildRegistration,
  validateReminderCreation,
  validateIdParam,
  validateRegister,
  validateLogin
};
