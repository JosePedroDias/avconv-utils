var avconv = require('avconv');    // see INSTALL.md
var async  = require('async');
var extend = require('extend');
var fs     = require('fs');
var gm     = require('gm');        // sudo apt-get install graphicsmagick
var guid   = require('node-uuid');



/**
 * @module avconv-utils
 */



/**
 * Returns an object with the most relevant information found in avconv output
 *
 * @function getMetadata
 * @param {String}     media  path to media file to analyse
 * @param {Function}   cb     callback
 */
var getMetadata = function(media, cb) {
  var stream = avconv([ // TODO which switch to say I just want the metadata and no errorcode?
    '-i', media
  ]);


  var d = [];

  stream.on('message', function(data) {
    d.push(data);
  });

  stream.once('exit', function(exitCode, signal) {
      d = d.join(''); //console.log(d);

      var md = {};


      var m = (/Duration: ([^,]+)/m).exec(d); //console.log(m);
      md.duration = m[1];

      md.durationSecs = new Date('1970-01-01T' + md.duration + 'Z').getTime() / 1000;


      m = (/Video: ([^,]+)/m).exec(d); //console.log(m);
      if (m) {
        md.vCodec = m[1];

        m = (/([^\n]+)/m).exec(d.substring(m.index)); //console.log(m);
        md.vDetails = m[1];

        // start looking from where I found previous match
        m = (/(\d+)x(\d+)/m).exec(d.substring(m.index)); //console.log(m);

        md.dimensions = [
          parseInt(m[1], 10),
          parseInt(m[2], 10)
        ];
      }


      m = (/Audio: ([^,]+)/m).exec(d); //console.log(m);
      if (m) {
        md.aCodec = m[1];

        // start looking from where I found previous match
        m = (/([^\n]+)/m).exec(d.substring(m.index)); //console.log(m);
        md.aDetails = m[1];
      }


      cb(null, md);
  });
};



/**
 * Extracts and stores video frames from given video.
 *
 * @function extractFrames
 * @param {Object}     o
 * @param {String}     o.inFile                        video file to use
 * @param {Number[2]}  o.videoDimensions               dimensions assumed for the video (used if scale is passed)
 * @param {String}    [o.guid]                         if ommited a GUID will be auto generated
 * @param {Number}    [o.fps]=1                        sample every n frames per second
 * @param {Number}    [o.startTime]                    start time to sample, in seconds
 * @param {Number}    [o.numFrames]                    number of frames to sample
 * @param {Number}    [o.duration]                     max duration to sample, in seconds
 * @param {Number}    [o.scale]=1                      scales the video frames
 * @param {String}    [o.outPath]='/tmp'               directory where generated content will be put
 * @param {String}    [o.outImageMask]='GUID_%04.png'  generated images mask
 * @param {String}    [o.outJSON]='GUID.json'          generated json file name
 * @param {String}    [o.debug]=false                  outputs debug info to console if trueish
 * @param {Function}   cb                              callback
 */
var extractFrames = function(o, cb) {
  if (typeof o !== 'object') {
    return cb('1st argument should be an object!');
  }

  if (typeof o.inFile !== 'string') {
    return cb('inFile options is required!');
  }

  o = extend({
    fps:           1,
    scale:         1,
    outPath:      '/tmp',
    outImageMask: 'GUID_%04d.jpg'
  }, o);

  if (o.scale !== 1) {
    if (typeof o.videoDimensions !== 'object' ||
        o.videoDimensions.length !== 2 ||
        typeof o.videoDimensions[0] !== 'number' ||
        typeof o.videoDimensions[1] !== 'number') {
      return cb('videoDimensions options is required and should be Number[2]!');
    }
  }

  if (!o.guid) {
    o.guid = guid.v1();
  }
  o.outImageMask = o.outImageMask.replace('GUID', o.guid);

  //console.log('options ef:', o);

  var dims = o.videoDimensions;
  var s = o.scale;
  var fDims = [
    Math.round(dims[0] * s),
    Math.round(dims[1] * s)
  ];

  // http://libav.org/avconv.html#Video-and-Audio-grabbing
  var params = [
    '-i', o.inFile,
    '-vsync', '1',
    '-r', ''+o.fps, // fps rate
  ];

  if (o.startTime) { params = params.concat(['-ss', o.startTime]); }
  if (o.numFrames) { params = params.concat(['-vframes', o.numFrames]); }
  if (o.duration)  { params = params.concat(['-t', o.duration]); }

  if (s !== 1) {
    params = params.concat(['-s', fDims[0] + 'x' + fDims[1]]); // scale
  }

  params = params.concat(['-an', '-y', o.outPath + '/' + o.outImageMask]);

  if (o.debug) {
    console.log('avconv params: ', params.join(' '));
  }



  // returns a readable stream
  var stream = avconv(params);



  // anytime avconv outputs anything, forward these results to process.stdout
  //stream.pipe(process.stdout);



  stream.once('exit', function(exitCode, signal) {
    if (exitCode !== 0) {
      return cb(exitCode);
    }

    fs.readdir(o.outPath, function(err, files) {
      files = files.filter(function(f) {
        return f.indexOf(o.guid) === 0;
      }).map(function(f) {
        return o.outPath + '/' + f;
      });
      cb(err, {
        files:           files,
        frameDimensions: fDims
      });
    });
  });
};



// choose mosaic grid automatically

var generateMosaicCombinations = function(dims, n) {
  var i = 1;
  var res = [];
  var g;
  do {
    g = [i, Math.ceil( n / i )];
    res.push({
      grid: g,
      dims: [
        dims[0] * g[0],
        dims[1] * g[1]
      ]
    });
    ++i;
  } while (i <= n);
  return res;
};



// strategies

var strategies = {
  horizontal: function(res) {
    return res.pop().grid;
  },
  vertical: function(res) {
    return res.shift().grid;
  },
  generic: function(res) { // minimizes .v
    var getV = function(i) { return i.v; };
    var sorter = function(a, b) { return getV(a) - getV(b); };
    res.sort(sorter);
    return res.shift().grid; // get least value
  }
};



/**
 * Creates image mosaic from the given frames.
 *
 * Uses the given grid to layout frames or generates grid based on strategy.
 *
 * ar_a_b tries to generate a mosaic with closest aspect ratio to a / b.
 *
 * @function createImageMosaic
 * @param {Object}     o
 * @param {String}     o.outFile                 image file to save mosaic in
 * @param {String[]}   o.files                   each image file to mosaic
 * @param {Number[2]}  o.frameDimensions         each extracted frame dimensions
 * @param {Number[2]} [o.grid]                   if ommitted uses strategy option to generate the grid automatically
 * @param {String}    [o.strategy]='horizontal'  one of: 'horizontal', 'vertical', 'ar_a_b'. used if grid option is ommitted to elect the mosaic aspect
 * @param {Boolean}   [o.deleteFiles]=false      if trueish and mosaic is created, deletes frame files
 * @param {Function}   cb                        callback
 */
var createImageMosaic = function(o, cb) {
  if (!o.grid) {
    var res = generateMosaicCombinations(o.frameDimensions, o.files.length);

    if      (!o.strategy) {                 o.strategy = 'horizontal'; }
    else if ( o.strategy === 'square') {    o.strategy = 'ar_1_1';     } // handles old strategies too
    else if ( o.strategy === 'leastArea') { o.strategy = 'horizontal'; }

    var stratFn;
    if (o.strategy.indexOf('ar_') === 0) {
      var parts = o.strategy.split('_');
      if (parts.length !== 3) {
        return cb('ar strategy expects ar_<int>_<int>!');
      }
      var targetAR = parseInt(parts[1], 10) / parseInt(parts[2], 10);
      if (isNaN(targetAR)) {
        return cb('ar strategy expects ar_<int>_<int>!');
      }

      res.forEach(function(item) {
        var ar = item.dims[0] / item.dims[1];
        item.v = ar < targetAR ? targetAR - ar : ar - targetAR;
      });

      stratFn = strategies.generic;
    }
    else {
      stratFn = strategies[ o.strategy ];
      if (!stratFn) {
        return cb('strategy not found! use one of: "horizontal", "vertical", "ar_a_b"');
      }
    }

    o.grid = stratFn(res);
  }

  // http://stackoverflow.com/questions/17369842/tile-four-images-together-using-node-js-and-graphicsmagick
  var g = gm();
  var x, y, f, i = 0;
  var w = o.frameDimensions[0];
  var h = o.frameDimensions[1];
  for (y = 0; y < o.grid[1]; ++y) {
    for (x = 0; x < o.grid[0]; ++x) {
      f = o.files[i++];
      if (!f) { break; }
      g = g.in('-page', ['+', x*w, '+', y*h].join('')).in(f);
    }
  }

  g.mosaic()
   .write(o.outFile, function(err) {
      if (err) { return cb(err); }

      var cb2 = function(err) {
        o.n = o.files.length;
        delete o.files;
        cb(err, extend({
          mosaicDimensions: [
            w * o.grid[0],
            h * o.grid[1]
          ]
        }, o));
      };

      if (o.deleteFiles) {
        async.each(o.files, fs.unlink, cb2);
      }
      else {
        cb2(null);
      }
   });
};



/**
 * High level function which uses the other ones to perform whole workflow.
 *
 * ar_a_b tries to generate a mosaic with closest aspect ratio to a / b.
 *
 * @function doMosaicMagic
 * @param {Object}     o
 * @param {String}     o.video                   path to video file to analyse
 * @param {String}     o.mosaic                  path where to store the generated mosaic image
 * @param {Number}    [o.fps]=1                  sample every n frames per second
 * @param {Number}    [o.scale]=1                scales the video frames
 * @param {String}    [o.strategy]='horizontal'  one of: 'horizontal', 'vertical', 'ar_a_b'
 * @param {Function}   cb                        callback
 */
var doMosaicMagic = function(o, cb) {
  getMetadata(o.video, function(err, md) {
    if (err) {
      return cb('problem in getMetadata: ' + err);
    }

    if (o.debug) {
      console.log('getMetadata output:\n', md);
    }

    extractFrames({
      inFile:          o.video,
      videoDimensions: md.dimensions,
      fps:             o.fps,
      scale:           o.scale
    }, function(err, info) {
      if (err) {
        return cb('problem in extractFrames: ' + err);
      }

      if (o.debug) {
        console.log('extractFrames output:\n', info);
      }

      createImageMosaic({
        files:           info.files,
        frameDimensions: info.frameDimensions,
        strategy:        o.strategy,
        outFile:         o.mosaic,
        deleteFiles:     true
      }, function(err, info2) {
        if (err) {
          return cb('problem in createImageMosaic: ' + err);
        }

        if (o.debug) {
          console.log('createImageMosaic output:\n', info2);
        }

        info2.videoDuration   = md.durationSecs;
        info2.videoDimensions = md.dimensions;

        cb(null, info2);
      });
    });
  });
};



// auxiliary stuff, used in binaries and stuff

var repeatStr = function(str, times) {
  var a = new Array(times + 1);
  return a.join(str);
};

var uncamelizeStr = function(str) {
  return str.replace(/[A-Z]/g, ' $&').toLowerCase();
};

var listObj = function(o, arr) {
  var keys = Object.keys(o);
  var keys2 = {};
  var maxKL = 0;

  keys.forEach(function(k) {
    var v = uncamelizeStr(k);
    keys2[k] = v;
    if (v.length > maxKL) { maxKL = v.length; }
  });

  keys.forEach(function(k) {
    var k2 = keys2[k];
    var kl = k2.length;
    arr = arr.concat(['  ', k2, ': ', repeatStr(' ', maxKL - kl), JSON.stringify(o[k], null, '')], '\n');
  });

  return arr;
};

var printObj = function(label, o) {
  var arr = [label, ':\n'];
  arr = listObj(o, arr);
  console.log(arr.join(''));
};

var printHR = function() {
  console.log('------------------\n');
};



module.exports = {
  getMetadata:       getMetadata,
  extractFrames:     extractFrames,
  createImageMosaic: createImageMosaic,
  doMosaicMagic:     doMosaicMagic,

  _printObj:         printObj,
  _printHR:          printHR
};
