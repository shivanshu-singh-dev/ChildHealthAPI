const crypto = require('crypto');
const childRepository = require('../database/childRepository');

/**
 * Registers a new child in SQLite storage
 * @param {object} childData 
 * @returns {object} created child profile
 */
function registerChild(childData) {
  const newChild = {
    id: crypto.randomUUID(),
    name: childData.name.trim(),
    dateOfBirth: childData.dateOfBirth.trim(),
    guardianName: childData.guardianName.trim(),
    state: childData.state.trim(),
    consentStatus: childData.consentStatus,
    createdAt: new Date().toISOString()
  };

  return childRepository.create(newChild);
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
