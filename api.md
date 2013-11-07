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





