var __ = require('lodash'),
    path = require('path'),
    Q = require('q'),
    YAML = require('yamljs');

var config = {},
    _process = {};

var DEFAULT_CONFIG_PATH = './defaults.json',
    LOCAL_PACKAGE_PATH = '../package.json',
    LOCAL_CONFIG_PATH = path.resolve(process.cwd(), 'siteshooter.yml');

function getLocalOptions(callback) {

    var returnError,
        siteshooterConfig;

    try{
        siteshooterConfig = YAML.load(LOCAL_CONFIG_PATH);

        siteshooterConfig = JSON.parse(JSON.stringify(siteshooterConfig));

        if( !siteshooterConfig.domain.name ){

            throw new Error('Missing setting: domain.name');
        }

        siteshooterConfig.domain.uri = new require('url-parse')(siteshooterConfig.domain.name);

        // set default protocol is one doesn't exist
        if (siteshooterConfig.domain.uri.protocol === '') {

            siteshooterConfig.domain.name = 'http://' + siteshooterConfig.domain.name;

            siteshooterConfig.domain.uri = new require('url-parse')(siteshooterConfig.domain.name);
        }

        siteshooterConfig.domain.uri.username = siteshooterConfig.domain.auth.user;
        siteshooterConfig.domain.uri.password = siteshooterConfig.domain.auth.pwd;

        if( siteshooterConfig.domain.uri.username !== '' && siteshooterConfig.domain.uri.password !== '' ){
            siteshooterConfig.domain.uri.auth = true;
        }
    }
    catch (error) {
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

function getDefaultOptions() {
    return require(DEFAULT_CONFIG_PATH);
}

config.mergeOptions = function(options) {


    var d = Q.defer(),
        self = this;

    getLocalOptions(function(error, data){

        if( error ){

            if (error.code === 'ENOENT') {
                d.reject(Error('Missing siteshooter.yml file. Run the following command to create one: \n\n $ siteshooter --init \n\n'));
            }
            else{
                d.reject(Error('Loading siteshooter.yml\n\n' + error + '\n\n'));
            }
        }
        else{

            var localOptions = data,
                npmPackageOptions = getNpmPackageOptions(),
                defaultOptions = getDefaultOptions();

            var mergedOptions = __.defaultsDeep({}, options, localOptions, {
                npm: npmPackageOptions
            },defaultOptions);

            mergedOptions.name = npmPackageOptions.name || path.basename(process.cwd());
            mergedOptions.module.paths.src = path.resolve(__dirname, '../');

            self.options = mergedOptions;

            d.resolve(self.options);
        }

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
