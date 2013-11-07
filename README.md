# motivation

Can be used to fetch frames from a video and create
mosaics out of them for better storage and distribution.

Possible usage scenarios:

* show preview in video slider
* auxiliary imagery for non linear editing of videos



# requirements

* Requires graphicsmagick to be installed:

    sudo apt-get install graphicsmagick

* Requires avconv to be installed with x264 support (if reading h.264 videos)
Read how to do it [here](INSTALL.md).



# example

This is the example features in [samples/doMosaicMagic.js](samples/doMosaicMagic.js)

source video:

<iframe src="http://videos.sapo.pt/playhtml?file=http://rd3.videos.sapo.pt/jTE4TOJANeatDmQi341m/mov/1" frameborder="0" scrolling="no" width="400" height="350"></iframe>

```javascript
var au = require('avconv-utils');
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
```

result is:

```javascript
{
  mosaicDimensions: [870, 984],
  frameDimensions:  [145, 82],
  strategy:         'square',
  outFile:          'samples/mosaics/jTE4TOJANeatDmQi341m.jpg',
  grid:             [6, 12],
  n:                68,
  videoDuration:    66.41,
  videoDimensions:  [580, 326]
}
```

and:

![resulting mosaic](samples/mosaics/jTE4TOJANeatDmQi341m.jpg)


# API

Check [API](api.md).

Usage examples in bin/run command line utility and tests directory.
