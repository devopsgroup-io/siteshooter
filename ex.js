var StaticServer = require('static-server')
var html2png = require('html2png')
var forEach = require('async-foreach').forEach
var sizeOf = require('image-size')
var glob = require('glob')
var path = require('path')
var PDF = require('pdfkit')
var tmp = require('tmp')
var fs = require('fs-extra')

function getDate () {
  return new Date().toLocaleString().replace(/\//gi, '-').replace(/:/gi, '.').replace(/,/gi, '')
}

/**
 * Takes screenshots of a folder of static html
 * @param {String}   sitePath  Relative path to site
 * @param {Object}   opts      Options to pass to screen-shot: output|pdf
 * @param {Function} callback  Error-first callback
 * @returns {String}           Callback fullfilled with string path to pdf or screenshots
 */
var screenshot = function (sitePath, opts, callback) {
  if (!sitePath) {
    callback('Error: please include a relative path to html as the first argument.')
  }

  if (typeof opts === 'function') {
    callback = opts
    opts = {}
  }

  if (!opts) {
    opts = {}
  }

  var options = {
    name: opts.name || getDate(),
    output: opts.output || './',
    width: opts.width || 1280,
    format: opts.format || 'pdf',
    host: opts.host || 'localhost',
    port: opts.port || 5678,
    browser: opts.browser || 'firefox'
  }

  var inputDir = path.resolve(process.cwd(), sitePath)
  var outputDir = path.resolve(process.cwd(), options.output)
  var tmpDir = tmp.dirSync({ unsafeCleanup: true })
  fs.mkdirsSync(outputDir)

  function cleanUp () {
    fs.removeSync(tmpDir.name)
    server.stop()
  }

  function checkError (err) {
    if (err) {
      cleanUp()
      callback(err)
    }
  }

  // Take screenshots of every page
  function takeScreenshots (err, files) {
    checkError(err)

    var screenshot = html2png({ width: options.width, browser: options.browser})
    var pngs = []
    var urls = files.map(function (file) {
      return 'http://' + options.host + ':' + options.port + file.replace(inputDir, '')
    })

    forEach(urls, function (url, i) {
      var done = this.async()
      screenshot.renderUrl(url, function (err, buffer) {
        if (err) {
          done()
        }
        var filename = options.name + '-' + i + '.png'
        var pngPath = path.join(tmpDir.name, filename)
        fs.writeFile(pngPath, buffer, 'base64', function (err) {
          if (err) {
            done()
          }
          pngs.push(pngPath)
          done()
        })
      })
    }, function (success, array) {
      screenshot.close()
      if (options.format === 'png') {
        copyPNGS(pngs)
      } else {
        createPDF(pngs)
      }
    })
  }

  function copyPNGS (pngs) {
    fs.copy(tmpDir.name, outputDir, function (err) {
      checkError(err)
      cleanUp()
      callback(null, outputDir)
    })
  }

  function layout (width, height) {
    return width > height ? 'landscape' : 'portrait'
  }

  // Put all the screenshots into a pdf
  function createPDF (pngs) {
    var heights = pngs.map(function (png) {
      return sizeOf(png).height
    })
    var tallest = Math.max.apply(Math, heights)

    var pdf = new PDF({
      layout: layout(options.width, tallest),
      size: [options.width, tallest],
      margin: 0
    })

    var pdfPath = path.resolve(outputDir, options.name + '.pdf')
    pdf.pipe(fs.createWriteStream(pdfPath))
    pngs.forEach(function (png, i) {
      if (i > 0) {
        pdf.addPage()
      }
      pdf.image(png)
    })

    pdf.end()
    cleanUp()
    callback(null, pdfPath)
  }

  // Start up a static server
  var server = new StaticServer({
    rootPath: inputDir,
    port: options.port,
    host: options.host
  })

  server.start()

  // Kick off the process
  glob(path.join(inputDir, '**/*.html'), takeScreenshots)
}

module.exports = screenshot