/* global it, describe */

'use strict';
var assert = require('assert'),
    siteshooter;


describe('acceptance tests for siteshooter Module', function() {

    it('module can be imported without blowing up', function() {
        siteshooter = require('../index');

        assert(siteshooter !== undefined);
    });
});
