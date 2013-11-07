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
 * returns an object with the most relevant information found in avconv output
 *
 * @function getMetadata
 * @param {String}     video  path to video file to analyse
 * @param {Function}   cb     callback
 */
var getMetadata = function(video, cb) {
  var stream = avconv([ // TODO which switch to say I just want the metadata and no errorcode?
    '-i', video
  ]);


  var d = [];

  stream.on('data', function(data) {
    d.push(data);
  });

  //stream.pipe(process.stdout);

  stream.once('end', function(exitCode, signal) {
      d = d.join('');
      //console.log(d);


      var m = (/Duration: ([^,]+)/m).exec(d);
      //console.log(m);
      var duration = m[1];


      var durationSecs = new Date('1970-01-01T' + duration + 'Z').getTime() / 1000;


      m = (/Video: ([^,]+)/m).exec(d);
      //console.log(m);
      var vCodec = m[1];


      m = (/([^\n]+)/m).exec(d.substring(m.index));
      //console.log(m);
      var vDetails = m[1];


      m = (/(\d+)x(\d+)/m).exec(d.substring(m.index)); // start looking from where I found previous match
      //console.log(m);
      var dimensions = [
        parseInt(m[1], 10),
        parseInt(m[2], 10)
      ];


      m = (/Audio: ([^,]+)/m).exec(d);
      //console.log(m);
      var aCodec = m[1];


      m = (/([^\n]+)/m).exec(d.substring(m.index));
      //console.log(m);
      var aDetails = m[1];


      var md = {
        duration:     duration,
        durationSecs: durationSecs,
        vCodec:       vCodec,
        vDetails:     vDetails,
        dimensions:   dimensions,
        aCodec:       aCodec,
        aDetails:     aDetails
      };

      //console.log('e', exitCode, 's', signal);

      cb(null, md);
  });
};



/**
 * extracts and stores frames
 *
 * @function extractFrames
 * @param {Object}     o
 * @param {String}     o.inFile                        video file to use
 * @param {Number[2]}  o.videoDimensions               dimensions assumed for the video (used if scale is passed)
 * @param {String}    [o.guid]                         if ommited a GUID will be auto generated
 * @param {Number}    [o.fps]=1                        sample every n frames per second
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
    // -ss start at time x
    // vframes number of frames to record
    // t limit duration, in seconds or hh:mm:ss[.xxx]
  ];

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



  stream.once('end', function(exitCode, signal) {
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
  square: function(res) {
    res.forEach(function(item) {
      var ar = item.dims[0] / item.dims[1];
      item.ar = ar < 1 ? 1 - ar : ar - 1;
    });
    var arGetter = function(i) { return i.ar; };
    var arSort = function(a, b) { return arGetter(a) - arGetter(b); };
    res.sort(arSort);
    return res.shift().grid;
  },
  leastArea: function(res) {
    res.forEach(function(item) {
      item.area = item.dims[0] * item.dims[1];
    });
    var areaGetter = function(i) { return i.area; };
    var areaSort = function(a, b) { return areaGetter(a) - areaGetter(b); };
    res.sort(areaSort);
    return res.shift().grid;
  }
};



/**
 * @function createImageMosaic
 * @param {Object}     o
 * @param {String}     o.outFile                 image file to save mosaic in
 * @param {String[]}   o.files                   each image file to mosaic
 * @param {Number[2]}  o.frameDimensions         each extracted frame dimensions
 * @param {Number[2]} [o.grid]                   if ommitted uses strategy option to generate the grid automatically
 * @param {String}    [o.strategy]='horizontal'  one of: 'horizontal', 'vertical', 'square', 'leastArea'. used if grid option is ommitted to elect the mosaic aspect
 * @param {Boolean}   [o.deleteFiles]=false      if trueish and mosaic is created, deletes frame files
 * @param {Function}   cb                        callback
 */
var createImageMosaic = function(o, cb) {
  if (!o.grid) {
    var res = generateMosaicCombinations(o.frameDimensions, o.files.length);

    if (!o.strategy) { o.strategy = 'horizontal'; }

    var strategy = strategies[o.strategy];
    if (!strategy) {
      return cb('strategy not found! use one of: "' + Object.keys(strategies).join('", "') + '"');
    }
    o.grid = strategy(res);
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



module.exports = {
  getMetadata:       getMetadata,
  extractFrames:     extractFrames,
  createImageMosaic: createImageMosaic
};
