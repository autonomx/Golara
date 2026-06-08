// main.js

// Importing necessary modules from k6 and other libraries
import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { vu } from 'k6/execution';


// Importing functions from local helper modules
import {getCrocodiles} from '../helper/api/sampleApi.js';

// Importing user manager
import { accountData, getUserForVU } from '../helper/userManager.js';

// Loading environment-specific configurations and utilities
const config_env = __ENV.config_env; // Environment configuration (e.g., 'dev', 'prod')
const config = require(`../config/${config_env}/config.js`).config; // Load main configuration
const host = require(`../config/${config_env}/host.js`); // Load host configuration


// Main function executed by k6 during the test
export async function k6SampleTest() {
    // Select a unique user account for the current VU
    const user = getUserForVU();
    console.log('Unique user: ', JSON.stringify(user));

    // Extract user credentials and household ID
    let authUsername = user.username;
    let authPassword = user.password;
    let householdId = user.householdId;

    console.log('auth.username:', authUsername);
    console.log('auth.password:', authPassword);

    let jsonResponse = getCrocodiles(host)
}