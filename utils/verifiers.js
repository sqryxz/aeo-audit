/**
 * Verifier Utilities for AEO Agency
 * Provides validation functions for JSON files against schemas
 */

const fs = require('fs');
const path = require('path');

// Lazy-load Ajv for schema validation
let ajvInstance = null;
function getAjv() {
  if (!ajvInstance) {
    try {
      const Ajv = require('ajv');
      const addFormats = require('ajv-formats');
      ajvInstance = new Ajv({ allErrors: true });
      addFormats(ajvInstance);
    } catch (e) {
      console.warn('Ajv not installed - schema validation limited');
      return null;
    }
  }
  return ajvInstance;
}

/**
 * Load a JSON schema from disk
 * @param {string} schemaName - Name of schema (without .json extension)
 * @returns {object|null} Schema object or null if not found
 */
function loadSchema(schemaName) {
  const schemaPath = path.join(__dirname, '..', 'schemas', `${schemaName}.json`);
  try {
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    return JSON.parse(schemaContent);
  } catch (e) {
    console.error(`Failed to load schema ${schemaName}: ${e.message}`);
    return null;
  }
}

/**
 * Validate a JSON file against its schema
 * @param {string} dataPath - Path to JSON file to validate
 * @param {string} schemaName - Name of schema to validate against
 * @returns {{valid: boolean, errors: array, data: object}}
 */
function validateJsonFile(dataPath, schemaName) {
  const result = { valid: false, errors: [], data: null };
  
  // Load data
  try {
    const dataContent = fs.readFileSync(dataPath, 'utf8');
    result.data = JSON.parse(dataContent);
  } catch (e) {
    result.errors.push({ type: 'parse', message: `Failed to parse JSON: ${e.message}` });
    return result;
  }
  
  // Load schema
  const schema = loadSchema(schemaName);
  if (!schema) {
    result.errors.push({ type: 'schema', message: `Schema ${schemaName} not found` });
    return result;
  }
  
  // Validate
  const validator = getAjv();
  if (!validator) {
    // Fallback: basic validation without Ajv
    result.valid = true;
    result.errors.push({ type: 'warning', message: 'Ajv not available - skipping strict validation' });
    return result;
  }
  
  const validate = validator.compile(schema);
  if (validate(result.data)) {
    result.valid = true;
  } else {
    result.errors = validate.errors || [];
  }
  
  return result;
}

/**
 * Validate customer.json input
 * @param {string} customerPath - Path to customer.json
 * @returns {{valid: boolean, errors: array}}
 */
function validateCustomer(customerPath) {
  return validateJsonFile(customerPath, 'customer');
}

/**
 * Validate site_snapshot.json
 * @param {string} snapshotPath - Path to site_snapshot.json
 * @returns {{valid: boolean, errors: array}}
 */
function validateSiteSnapshot(snapshotPath) {
  return validateJsonFile(snapshotPath, 'site_snapshot');
}

/**
 * Validate issues.json
 * @param {string} issuesPath - Path to issues.json
 * @returns {{valid: boolean, errors: array}}
 */
function validateIssues(issuesPath) {
  return validateJsonFile(issuesPath, 'issues');
}

/**
 * Check that required directories exist
 * @param {string} baseDir - Base directory for the workspace
 * @param {array} requiredDirs - Array of required directory names
 * @returns {{valid: boolean, missing: array}}
 */
function verifyDirectories(baseDir, requiredDirs) {
  const result = { valid: true, missing: [] };
  
  for (const dir of requiredDirs) {
    const dirPath = path.join(baseDir, dir);
    if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
      result.valid = false;
      result.missing.push(dir);
    }
  }
  
  return result;
}

/**
 * Verify all required schema files exist
 * @param {string} schemasDir - Path to schemas directory
 * @returns {{valid: boolean, missing: array}}
 */
function verifySchemas(schemasDir) {
  const requiredSchemas = ['customer.json', 'site_snapshot.json', 'issues.json'];
  const result = { valid: true, missing: [] };
  
  for (const schema of requiredSchemas) {
    const schemaPath = path.join(schemasDir, schema);
    if (!fs.existsSync(schemaPath)) {
      result.valid = false;
      result.missing.push(schema);
    }
  }
  
  return result;
}

module.exports = {
  loadSchema,
  validateJsonFile,
  validateCustomer,
  validateSiteSnapshot,
  validateIssues,
  verifyDirectories,
  verifySchemas
};
