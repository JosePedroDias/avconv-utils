var au = require('../lib/avconv-utils');

au.getMetadata(
  '../test-videos/jTE4TOJANeatDmQi341m.mp4',
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
  duration:     '00:01:06.41',
  durationSecs: 66.41,
  vCodec:       'h264 (Constrained Baseline)',
  vDetails:     'Video: h264 (Constrained Baseline), yuv420p, 580x326 [PAR 1:1 DAR 290:163], 694 kb/s, 24 fps, 24 tbr, 24 tbn, 48 tbc',
  dimensions:   [580, 326],
  aCodec:       'aac',
  aDetails:     'Audio: aac, 48000 Hz, stereo, s16, 127 kb/s'
}
*/
