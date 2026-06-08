const config_env = __ENV.config_env; // Environment configuration (e.g., 'dev', 'prod')
const config = require(`../config/${config_env}/config.js`).config; // Load main configuration
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { k6SampleTest } from './k6SampleTest.js';


// Define constant variables based on environment and configuration
const test_mode = __ENV.test_mode; // Test mode (e.g., 'smoke', 'load', 'stress', 'soak')
const base_url = config["base_url"]; // Base URL of the tested site
const stages = config[test_mode]["stages"]; // Test stages defined in configuration
console.log("Configuration", JSON.stringify({ test_mode, config_env, base_url, stages }));

// Define options for the k6 test execution
export const options = stages;

export function setup(){
  
}


/*
To Run Tests with logging to file:
TEST_FUNCTION=k6sample K6_WEB_DASHBOARD=true K6_WEB_DASHBOARD_EXPORT=report/html-report.html k6 run -e test_mode=smoke -e config_env=qa --log-output=file=report/sample_log.json --log-format=json src/test/testRunner.js

To Run tests without logging to file
TEST_FUNCTION=k6sample K6_WEB_DASHBOARD=true K6_WEB_DASHBOARD_EXPORT=report/html-report.html k6 run -e test_mode=smoke -e config_env=qa src/test/testRunner.js

To Run tests with grafana
TEST_FUNCTION=k6sample K6_WEB_DASHBOARD=true K6_WEB_DASHBOARD_EXPORT=report/html-report.html k6 run -e test_mode=smoke -e config_env=qa --out influxdb=http://localhost:8086/smarthomedb--log-format=json src/test/testRunner.js

*/

export default function runTest(data) {
    if (!__ENV.TEST_FUNCTION) {
        console.error('No valid TEST_FUNCTION environment variable set');
        return;
    }
    console.log(`Running test with test_function`);
    
    if (__ENV.TEST_FUNCTION === 'k6sample') {
        console.log("Configuration", JSON.stringify({ test_mode, config_env, base_url, stages }));

        k6SampleTest();
    }else {
        console.error('No valid TEST_FUNCTION environment variable set');
    }
}



export function handleSummary(data) {
  const filename = `report/summary_${__ENV.TEST_FUNCTION}.html`;
  return {
    [filename]: htmlReport(data),
  };
}
