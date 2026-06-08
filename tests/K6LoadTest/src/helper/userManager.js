
import { SharedArray } from 'k6/data';
import papaparse from 'https://jslib.k6.io/papaparse/5.1.1/index.js';

const config_env = __ENV.config_env; // Environment configuration (e.g., 'dev', 'prod')

// Load and parse the CSV file containing account data using Papa Parse
export const accountData = new SharedArray('account data', function () {
    // Load CSV file and parse it using Papa Parse
    return papaparse.parse(open(`../config/${config_env}/data/account.csv`), { header: true }).data;
});

// Function to get a unique user for each VU
export function getUserForVU() {
    // Ensure VUs do not exceed the number of accounts
    if (__VU > accountData.length) {
        throw new Error(`Number of VUs (${__VU}) exceeds number of users (${accountData.length})`);
    }

    console.log('Current VU: ', __VU);
    // Each VU gets a unique user based on their VU ID (1-based index)
    return accountData[__VU - 1];
}