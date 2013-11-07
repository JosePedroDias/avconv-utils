var au = require('../lib/avconv-utils');

au.doMosaicMagic(
  {
    video:    '../test-videos/jTE4TOJANeatDmQi341m.mp4',
    scale:    0.25,
    fps:      1,
    strategy: 'square',
    mosaic:   'mosaics/jTE4TOJANeatDmQi341m.jpg'
  },
  function(err, res) {
    if (err) { throw (err); }
    console.log(res);
  }
);

/*
SOURCE VIDEO COMES FROM:
http://videos.sapo.pt/jTE4TOJANeatDmQi341m

RESULT IS:
{
  mosaicDimensions: [870, 984],
  frameDimensions:  [145, 82],
  strategy:         'square',
  outFile:          'mosaic.jpg',
  grid:             [6, 12],
  n:                68,
  videoDuration:    66.41,
  videoDimensions:  [580, 326]
}
*/
