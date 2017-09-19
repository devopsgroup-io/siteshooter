var __ = require('lodash'),
    fs = require('fs'),
    path = require('path'),
    Q = require('q'),
    YAML = require('yamljs');

var config = {},
    _process = {};

var LOCAL_PACKAGE_PATH = '../package.json',
    LOCAL_CONFIG_PATH = path.resolve(process.cwd(), 'siteshooter.yml');


function getDefaultOptions() {
    return require('./defaults.json');
}

function setSiteshooterFile() {

    var deferred = Q.defer();

    // first make sure file doesn't exist so that we don't overwrite it
    fs.stat(LOCAL_CONFIG_PATH, function(err, stat) {

        if (err) {

            // file does not exist-
            if (err.code === 'ENOENT') {

                // grab siteshooter.yml template file from node module
                fs.readFile(path.resolve(__dirname, '../siteshooter.yml'), function(error, data) {

                    if (error) {
                        deferred.reject(err);
                    }

                    // now create siteshooter.yml template file
                    fs.writeFile('siteshooter.yml', data, function(err) {

                        if (err) {
                            deferred.reject(err);
                        } else {
                            deferred.resolve('siteshooter.yml file was successfully created');
                        }
                    });
                });
            }

        } else {
            deferred.reject('sitshooter.yml file already exists. Skipping --init');
        }
    });

    return deferred.promise;
}

function getSiteshooterFile(callback) {

    var defaultOptions = getDefaultOptions(),
        returnError,
        siteshooterConfig;

    try {
        siteshooterConfig = YAML.load(LOCAL_CONFIG_PATH);

        siteshooterConfig = JSON.parse(JSON.stringify(siteshooterConfig));

        if (!siteshooterConfig.domain.name) {

            throw new Error('Missing setting: domain name.\nExpected format:\n\n---\ndomain:\n  name: www.domain.com');
        }

        // merge default settings
        siteshooterConfig = __.defaultsDeep({}, siteshooterConfig, defaultOptions);

        siteshooterConfig.domain.uri = new require('url-parse')(siteshooterConfig.domain.name);

        // set default protocol is one doesn't exist
        if (siteshooterConfig.domain.uri.protocol === '') {

            siteshooterConfig.domain.name = 'http://' + siteshooterConfig.domain.name;

            siteshooterConfig.domain.uri = new require('url-parse')(siteshooterConfig.domain.name);
        }

        siteshooterConfig.domain.uri.username = siteshooterConfig.domain.auth.user;
        siteshooterConfig.domain.uri.password = siteshooterConfig.domain.auth.pwd;

        if (siteshooterConfig.domain.uri.username !== '' && siteshooterConfig.domain.uri.password !== '') {
            siteshooterConfig.domain.uri.auth = true;
        }
    } catch (error) {
        returnError = error;
    }

    return callback(returnError, siteshooterConfig);
}

function getNpmPackageOptions() {

    var pkg = {};

    try {
        pkg = require(LOCAL_PACKAGE_PATH);
    } catch (error) {
        pkg = {};
    }

    return {
        author: pkg.author,
        engines: pkg.engines,
        name: pkg.name,
        version: pkg.version
    };
}



function executeWhen(condition, func, successMsg, failureMsg) {
    if (Array.isArray(condition)) {
        condition = condition.reduce(function(acc, val) {
            return acc && val;
        }, true);
    }
    if (condition) {
        if (successMsg) {
            console.log(successMsg);
        }
        return func();
    } else {
        if (failureMsg) {
            console.log(failureMsg);
        }
        return (function() {
            var d = Q.defer();
            d.resolve('Short circuit');
            return d.promise;
        })();
    }
}

config.getSettings = function(options) {


    var d = Q.defer(),
        defaultOptions = getDefaultOptions(),
        npmPackageOptions = getNpmPackageOptions(),
        self = this;

    self.options = __.defaultsDeep({}, options, {
        npm: npmPackageOptions
    }, defaultOptions);


    // attempting to create a siteshooter.yml file? If not, move on to next excute statement.
    executeWhen(self.options.commands.init, setSiteshooterFile).then(

        // skip if creating a siteshooter.yml file
        executeWhen(!self.options.commands.init, function() {

            return getSiteshooterFile(function(error, data) {

                if (error) {

                    if (error.code === 'ENOENT') {
                        d.reject(Error('Missing siteshooter.yml file. Run the following command to create one: \n\n $ siteshooter --init \n\n'));
                    } else {
                        d.reject(Error('Loading siteshooter.yml\n\n' + error + '\n\n'));
                    }
                } else {

                    Object.assign(self.options, data);
                }

            });
        })).catch(function(error) {
        d.reject(error);
    }).done(function() {
        d.resolve(self.options);
    });


    return d.promise;

};

config.getOptions = function() {
    return this.options;
};

config.isDebug = function() {
    return this.options.commands.debug;
};

config.isDryRun = function() {
    return this.options.commands['dry-run'];
};

config.isForce = function() {
    return this.options.commands.force;
};

config.isVerbose = function() {
    return this.options.commands.verbose;
};


config.process = Object.create({
    get: function(key) {
        return _process[key];
    },
    set: function(key, value) {
        _process[key] = value;
    }
});

module.exports = Object.create(config);
