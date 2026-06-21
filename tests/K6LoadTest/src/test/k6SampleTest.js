// main.js

// Importing functions from local helper modules
import { getCrocodiles } from '../helper/api/sampleApi.js';

// Importing user manager
import { getUserForVU } from '../helper/userManager.js';

// Loading environment-specific configurations and utilities
const config_env = __ENV.config_env; // Environment configuration (e.g., 'dev', 'prod')
const host = require(`../config/${config_env}/host.js`); // Load host configuration

// Main function executed by k6 during the test
export async function k6SampleTest() {
    // Select a unique user account for the current VU
    const user = getUserForVU();
    console.log('Unique user selected for VU:', user.username);

    // Passwords and other credentials must never be logged in load-test output.
    getCrocodiles(host);
}
