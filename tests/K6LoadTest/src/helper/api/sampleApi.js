// assetManagement.js
import http from 'k6/http';
import { check, fail } from 'k6';
import { Trend } from 'k6/metrics';

const utils = require('../utils.js'); // Load utility functions
const { check_error } = utils;

const sampleApiTrend = new Trend('sampleApi_response_time');


export function getCrocodiles(host) {
    let singleAsset = '';

    let url = `${host.mobileAPI}/public/crocodiles`;

    let params = {
        headers: {
            'Accept': 'application/json'
        },
        tags: { name: 'crocodiles' } // Adding tags
    };

    let res = http.get(url, params);
    sampleApiTrend.add(res.timings.duration);


    let jsonResponse = res.json();

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