# Change Log

## version 0.1.4 (Friday, the 8th 2013)

* added getMetadata bin and renamed run to doMosaicMagic
* implemented generic strategy and exposed ar\_a\_b as a generic aspect ratio strategy (kept square and leastArea strategies to keep compatibility)
* getMetadata method now supports media without audio or video (quietly omits related fields in the result)
