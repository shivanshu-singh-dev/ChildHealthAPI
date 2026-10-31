const crypto = require('crypto');
const { children } = require('../storage/memoryStore');

/**
 * Register a new child and store in memory
 * @param {object} childData 
 * @returns {object} created child profile
 */
function registerChild(childData) {
  const newChild = {
    id: crypto.randomUUID(),
    name: childData.name.trim(),
    dateOfBirth: childData.dateOfBirth,
    guardianName: childData.guardianName.trim(),
    state: childData.state.trim(),
    consentStatus: childData.consentStatus,
    createdAt: new Date().toISOString()
  };

  children.set(newChild.id, newChild);
  return newChild;
}

/**
 * Retrieve a child profile by ID
 * @param {string} id 
 * @returns {object|null} child profile if found, otherwise null
 */
function getChildById(id) {
  return children.get(id) || null;
}

/**
 * Check if a child exists by ID
 * @param {string} id 
 * @returns {boolean}
 */
function childExists(id) {
  return children.has(id);
}

module.exports = {
  registerChild,
  getChildById,
  childExists
};
