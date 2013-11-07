var guid   = require('node-uuid');
var avconv = require('avconv');
var extend = require('extend');
//var stream = require('stream');
var fs     = require('fs');
var gm     = require('gm'); // sudo apt-get install graphicsmagick



/**
 * @function extractFrames
 * @param {Object}    o
 * @param {String}    o.inFile                        video file to use
 * @param [String]   [o.guid]                         if ommited a GUID will be auto generated
 * @param {Number}   [o.fps]=1                        sample every n frames per second
 * @param {String}   [o.outPath]='/tmp'               directory where generated content will be put
 * @param {String}   [o.outImageMask]='GUID_%04.png'  generated images mask
 * @param {String}   [o.outJSON]='GUID.json'          generated json file name
 * @param {Function}  cb                              callback
 */
var extractFrames = function(o, cb) {
  if (typeof o !== 'object') { throw 'param should be an object!'; }
  o = extend({
    fps:           1,
    scale:         1,
    outPath:      '/tmp',
    outImageMask: 'GUID_%04d.jpg'
  }, o);

  if (!o.guid) {
    o.guid = guid.v1();
  }
  o.outImageMask = o.outImageMask.replace('GUID', o.guid);

  //console.log('options ef:', o);

  var dims = [560, 314]; // TODO FETCH VIDEO DIMS
  var s = o.scale;
  var dims2 = [
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
    params = params.concat(['-s', dims2[0] + 'x' + dims2[1]]); // scale
  }

  params = params.concat(['-an', '-y', o.outPath + '/' + o.outImageMask]);

  //console.log('avconv params: ', params.join(' '));



  // returns a readable stream
  var stream = avconv(params);



  // anytime avconv outputs anything, forward these results to process.stdout
  //stream.pipe(process.stdout);



  // http://docs.nodejitsu.com/articles/advanced/streams/how-to-use-stream-pipe



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
        files:      files,
        dimensions: dims2
      });
    });
  });
};



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

var squarestMosaic = function(dims, n) {
  var res = generateMosaicCombinations(dims, n);
  res.forEach(function(item) {
    var ar = item.dims[0] / item.dims[1];
    item.ar = ar < 1 ? 1 - ar : ar - 1;
  });
  var arGetter = function(i) { return i.ar; };
  var arSort = function(a, b) { return arGetter(a) - arGetter(b); };
  res.sort(arSort);
  //console.log(res);
  return res.shift().grid;
};

var leastAreaMosaic = function(dims, n) {
  var res = generateMosaicCombinations(dims, n);
  res.forEach(function(item) {
    item.area = item.dims[0] * item.dims[1];
  });
  var areaGetter = function(i) { return i.area; };
  var areaSort = function(a, b) { return areaGetter(a) - areaGetter(b); };
  res.sort(areaSort);
  //console.log(res);
  return res.shift().grid;
};



/**
 * @function createImageMosaic
 * @param {Object}     o
 * @param {String}     o.outFile    image file to save mosaic in
 * @param {String[]}   o.files      each image file to mosaic
 * @param {Number[2]}  o.dimensions each extracted frame dimensions
 * @param {Number[2]] [o.grid]      if ommitted tries to find most 1x1 canvas
 * @param {Function}   cb           callback
 */
// http://stackoverflow.com/questions/17369842/tile-four-images-together-using-node-js-and-graphicsmagick
var createImageMosaic = function(o, cb) {
  if (!o.grid) {
    o.grid = squarestMosaic(o.dimensions, o.files.length);
  }

  var g = gm();
  var x, y, f, i = 0;
  var w = o.dimensions[0];
  var h = o.dimensions[1];
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
      o.n = o.files.length;
      delete o.files;
      cb(null, extend({
        mosaicDimensions: [
          w * o.grid[0],
          h * o.grid[1]
        ]
      }, o));
   });
};



module.exports = {
  extractFrames:     extractFrames,
  createImageMosaic: createImageMosaic
};



extractFrames({
  scale: 0.2,
  fps: 4,
  inFile: 'samsung.mp4'
}, function(err, info) {
  //console.log('step 1 res: ', info);

  createImageMosaic({
    files:      info.files,
    dimensions: info.dimensions,
    outFile:    'mosaic.jpg'
  }, function(err, info2) {
    if (err) { throw err; }
    console.log('step 2 res:', info2);
  });
});

