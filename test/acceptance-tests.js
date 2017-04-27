/* global it, describe */

'use strict';
var assert = require('assert'),
    exec = require('child_process').exec;


function siteshooter(task, done) {
    exec('siteshooter' + ' ' + task, done);
}


describe('acceptance tests for siteshooter Module', function() {

    it('module can be imported without blowing up', function() {

        var siteshooterLoad = require('../index');

        assert(siteshooterLoad !== undefined);
    });

    /*
    it('show help passes without error', function(done) {
        siteshooter('--help', function(error, stdout, stderr) {
            assert(error === null);
            done();
        });
    });

    it('show siteshooter.yml init passes without error', function(done) {
        siteshooter('--init', function(error, stdout, stderr) {
            console.log(stdout);
            assert.ok(error === null);
            done();
        });
    });
    */

});

