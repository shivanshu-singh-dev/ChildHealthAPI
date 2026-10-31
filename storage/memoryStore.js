/**
 * In-Memory Data Storage
 * 
 * Stores records for Children and Reminders during the application lifecycle.
 * In Level 1, we use JavaScript Maps for fast in-memory key-value lookups (O(1)).
 */

const children = new Map();
const reminders = new Map();

module.exports = {
  children,
  reminders,
  // Helper to reset store (useful for automated testing)
  resetStore: () => {
    children.clear();
    reminders.clear();
  }
};
