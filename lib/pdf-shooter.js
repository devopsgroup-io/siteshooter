'use strict';

var asynEach = require('async-foreach').forEach,
    chalk = require('chalk'),
    fs = require('graceful-fs'),
    globby = require('globby'),
    path = require('path'),
    PDF = require('pdfkit'),
    Q = require('q'),
    sizeOf = require('image-size'),
    utils = require('./utils');



function getDate() {

    var d = new Date(),
        date =
        d.getUTCFullYear() + '-' +
        (d.getUTCMonth() + 1) + '-' +
        d.getUTCDate();
    return date;
}

function getFiles(outputPath, size) {
    return globby.sync([path.join(outputPath, '**', '*' + size + '.png')]);
}

function createPDF(arrImages, dimensions, domainName, outputPath, viewport, done) {

    utils.log.verbose('createPDF', arguments);

    var date = getDate(),
        pdfPath = path.resolve(outputPath, utils.urlToDir(domainName) + '-' + viewport + '-' + date + '.pdf'),
        writeStream;

    utils.log.verbose('pdfPath', pdfPath);

    var pdf = new PDF({
        layout: 'portrait',
        size: [dimensions.width, sizeOf(arrImages[0]).height],
        margin: 0
    });



    writeStream = fs.createWriteStream(pdfPath);

    pdf.pipe(writeStream);

    pdf.pipe(fs.createWriteStream(pdfPath));

    arrImages.forEach(function(png, i) {

        //console.log('arrImages', i);
        if (i > 0) {
            pdf.addPage({
                margin: 0,
                size: [sizeOf(png).width, sizeOf(png).height],
                width: sizeOf(png).width,
                height: sizeOf(png).height
            });
        }
        pdf.image(png);

    });

    pdf.end();

    writeStream.on('finish', function () {

        done();

    });

}


/**
 * PDFShooter Object
 * @author Steven Britton
 * @date   2016-04-14
 * @param  {Object}  options [description]
 */
function PDFShooter(parameters) {

    utils.log.verbose('PDFShooter: constructor', parameters);


    this.options = parameters;

}


PDFShooter.prototype.start = function() {

    console.log(chalk.yellow.bold('\n ⤷ Generating PDFs'));

    var deferred = Q.defer(),
        domainName = this.options.domain.name,
        outputPath = this.options.paths.output,
        pdfs = [];


    // load array of viewports and their respective .png files
    pdfs = this.options.viewports.map(function(item, i) {
        return {
            'viewport': item.viewport,
            'dimensions': { 'width': item.width, 'height': item.height },
            'files': getFiles(outputPath, item.width)
        };
    });

    // create individual pdfs based on viewport
    asynEach(pdfs, function(item, i) {

        var done = this.async();


        // make sure we have some screenshots
        if (item.files.length > 0) {
            createPDF(item.files, item.dimensions, domainName, outputPath, item.viewport, function() {
                done();
            });
        } else {

            console.log(chalk.red.bold('   ✗ '), chalk.red('Screenshots for viewport '), chalk.red.bold(item.viewport), chalk.red(' do not exist.'));

            done();
        }

    }, function(success, array) {

        if (success) {
            deferred.resolve(array);
        } else {
            deferred.reject();
        }

    });

    return deferred.promise;

};

module.exports = PDFShooter;
