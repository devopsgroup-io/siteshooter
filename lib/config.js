var __ = require('lodash'),
    path = require('path'),
    YAML = require('yamljs');

var config = {},
    _process = {};

var DEFAULT_CONFIG_PATH = './defaults.json',
    LOCAL_PACKAGE_PATH = '../package.json',
    LOCAL_CONFIG_PATH = path.resolve(process.cwd(), 'siteshooter.yml');


function getLocalOptions(localConfigFile) {

    var localOptions = {},
        localOptionsPath = localConfigFile ? path.resolve(process.cwd(), localConfigFile) : LOCAL_CONFIG_PATH;

    try {

        var loadconfig = YAML.load(localOptionsPath);

        localOptions = JSON.parse(JSON.stringify(loadconfig));

    } catch (error) {

        // @todo: handle this exception. Currently, I don't show this becuase it will prevent the --init command
        if (error) {
            //console.log(error);
        }
    }

    localOptions.pkgFiles = __.isArray(localOptions.pkgFiles) && localOptions.pkgFiles.length === 0 ? false : localOptions.pkgFiles;

    return localOptions;

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
        name: pkg.name,
        version: pkg.version
    };
}

function getDefaultOptions() {
    return require(DEFAULT_CONFIG_PATH);
}

config.mergeOptions = function(options) {

    var localOptions = getLocalOptions(LOCAL_CONFIG_PATH),
        npmPackageOptions = getNpmPackageOptions(),
         defaultOptions = getDefaultOptions();

    var mergedOptions = __.defaultsDeep({}, options, localOptions, {
        npm: npmPackageOptions
    },defaultOptions);

    mergedOptions.name = npmPackageOptions.name || path.basename(process.cwd());
    mergedOptions.module.paths.src = path.resolve(__dirname, '../');


    // @todo: validate options
    if(mergedOptions.domain.name !== ''){
        mergedOptions.sitemapURL = mergedOptions.domain.name + '/' + mergedOptions.domain.sitemap.url + '.' + mergedOptions.domain.sitemap.type;
    }

    return (this.options = mergedOptions);

};

config.getOptions = function() {
    return this.options;
};

config.isDebug = function() {
    return this.options.debug;
};

config.isDryRun = function() {
    return this.options['dry-run'];
};

config.isForce = function() {
    return this.options.force;
};

config.isVerbose = function() {
    return this.options.verbose;
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
