# Change Log

## version 0.1.5 (Friday, the 16th May 2014)

* upgraded avconv dependency to 2.0.0 and its breaking event name changes. should be working fine


## version 0.1.4 (Friday, the 8th November 2013)

* added getMetadata bin and renamed run to doMosaicMagic
* implemented generic strategy and exposed ar\_a\_b as a generic aspect ratio strategy (kept square and leastArea strategies to keep compatibility)
* getMetadata method now supports media without audio or video (quietly omits related fields in the result)
