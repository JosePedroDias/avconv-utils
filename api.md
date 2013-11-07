# Documentation


















## Module: avconv-utils













**createImageMosaic**(
`Object` o,
`String` o.outFile,
`String[]` o.files,
`Number[2]` o.frameDimensions,
[`Number[2]` o.grid],
[`String` o.strategy],
[`Boolean` o.deleteFiles],
`Function` cb
) *function*

creates image mosaic from the given frames
uses the given grid to layout frames or generates grid based on strategy







---


**doMosaicMagic**(
`Object` o,
`String` o.video,
`String` o.mosaic,
[`Number` o.fps],
[`Number` o.scale],
[`String` o.strategy],
`Function` cb
) *function*

high level function which uses the other ones to perform whole workflow







---


**extractFrames**(
`Object` o,
`String` o.inFile,
`Number[2]` o.videoDimensions,
[`String` o.guid],
[`Number` o.fps],
[`Number` o.scale],
[`String` o.outPath],
[`String` o.outImageMask],
[`String` o.outJSON],
[`String` o.debug],
`Function` cb
) *function*

extracts and stores frames







---


**getMetadata**(
`String` video,
`Function` cb
) *function*

returns an object with the most relevant information found in avconv output







---





