import { Rate } from 'k6/metrics';
import { check, group, sleep } from 'k6';
import http from 'k6/http';

// Defining error rate
export let errorRate = new Rate('errors');


export const check_error = (message, response) => {
    const result = check(response, {
        [`${message} - status is OK!`]: (r) => r.status === 200 || r.status === 202 || r.status === 204
    }, { endpoint: response.url, status: response.status });
    if (!result) { // "If" should be there because errorRate graph in grafana won't work.
        errorRate.add(!result);   // Adding errorRate in case of check failure
    }
};


// Export all constants together
export default {
    check_error
};