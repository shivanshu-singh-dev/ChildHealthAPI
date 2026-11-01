const crypto = require('crypto');
const childRepository = require('../database/childRepository');
const { normalizeConsentStatus } = require('../utils/validator');

/**
 * Registers a new child in SQLite storage linked to an authenticated guardian
 * @param {object} childData 
 * @param {string} guardianId 
 * @returns {object} created child profile
 */
function registerChild(childData, guardianId) {
  const normalizedConsent = normalizeConsentStatus(childData.consentStatus) || 'granted';

  const newChild = {
    id: crypto.randomUUID(),
    guardianId: guardianId,
    name: childData.name.trim(),
    dateOfBirth: childData.dateOfBirth.trim(),
    guardianName: childData.guardianName.trim(),
    state: childData.state.trim(),
    consentStatus: normalizedConsent,
    createdAt: new Date().toISOString()
  };

  childRepository.create(newChild);

  // Return sanitized child profile (omit internal database linkage)
  return {
    id: newChild.id,
    name: newChild.name,
    dateOfBirth: newChild.dateOfBirth,
    guardianName: newChild.guardianName,
    state: newChild.state,
    consentStatus: newChild.consentStatus,
    createdAt: newChild.createdAt
  };
}

/**
 * Retrieves a child profile by ID
 * @param {string} id 
 * @returns {object|null} child profile or null
 */
function getChildById(id) {
  return childRepository.findById(id);
}

/**
 * Checks whether a child exists by ID
 * @param {string} id 
 * @returns {boolean}
 */
function childExists(id) {
  return childRepository.exists(id);
}

module.exports = {
  registerChild,
  getChildById,
  childExists
};
