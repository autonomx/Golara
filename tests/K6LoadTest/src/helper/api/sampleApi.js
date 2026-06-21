// assetManagement.js
import http from 'k6/http';
import { check, fail } from 'k6';
import { Trend } from 'k6/metrics';

const utils = require('../utils.js'); // Load utility functions
const { check_error } = utils;

const sampleApiTrend = new Trend('sampleApi_response_time');

export function getCrocodiles(host) {
    const url = `${host.mobileAPI}/public/crocodiles`;

    const params = {
        headers: {
            'Accept': 'application/json'
        },
        tags: { name: 'crocodiles' } // Adding tags
    };

    const res = http.get(url, params);
    sampleApiTrend.add(res.timings.duration);

    const jsonResponse = res.json();

    // Example threshold: fail if response time exceeds 5000ms
    if (res.timings.duration > 5000) {
        fail(`Response time for Generate Access Code API call exceeded threshold: ${res.timings.duration}ms`);
    }

    check_error('sampleApi', res);

    check(res, {
        'sampleApi status 200': (r) => r.status === 200
    });

    return jsonResponse;
}
