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

This example is available in [samples/doMosaicMagic.js](samples/doMosaicMagic.js)



Input video:

[ ![source video](http://cache03.stormap.sapo.pt/vidstore11/thumbnais/1c/f5/1e/7918426_dwspW.jpg) ](http://videos.sapo.pt/jTE4TOJANeatDmQi341m)


Source code:

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

Callback result is:

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

and the following mosaic image:

![resulting mosaic](samples/mosaics/jTE4TOJANeatDmQi341m.jpg)


# API

Check [API](api.md).

Usage examples in bin/run command line utility and tests directory.
