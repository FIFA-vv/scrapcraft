/**
 * Utility Engine: LocalStorage Adapter for Birthday Website Generator
 */

const STORAGE_KEY = 'wishcraft_birthday_config';

export const StorageManager = {
  /**
   * Save configuration object to LocalStorage
   * @param {Object} configData 
   * @returns {boolean} Success status
   */
  saveConfig(configData) {
    try {
      const serialized = JSON.stringify(configData);
      localStorage.setItem(STORAGE_KEY, serialized);
      return true;
    } catch (err) {
      console.error('[StorageManager] Failed to save config to LocalStorage:', err);
      return false;
    }
  },

  /**
   * Load configuration object from LocalStorage
   * @returns {Object|null} Config object or null if not found
   */
  loadConfig() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return null;
      return JSON.parse(data);
    } catch (err) {
      console.error('[StorageManager] Failed to load config from LocalStorage:', err);
      return null;
    }
  },

  /**
   * Clear saved configuration from LocalStorage
   */
  clearConfig() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.error('[StorageManager] Failed to clear config:', err);
    }
  },

  /**
   * Check if a saved configuration draft exists
   * @returns {boolean}
   */
  hasSavedConfig() {
    return localStorage.getItem(STORAGE_KEY) !== null;
  }
};
