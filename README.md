# s3-files

[![Build Status](https://travis-ci.org/orangewise/s3-files.js.svg?branch=master)](https://travis-ci.org/orangewise/s3-files.js)
[![Coverage Status](https://coveralls.io/repos/github/orangewise/s3-files.js/badge.svg?branch=master)](https://coveralls.io/github/orangewise/s3-files.js?branch=master)

Stream selected files from an Amazon s3 bucket/folder.

## Install

```
npm install s3-files
```

## Usage

```javascript

var s3Files = require('s3-files.js');

var region = 'bucket-region';
var bucket = 'name-of-s3-bucket';
var folder = 'name-of-bucket-folder/';
var file1 = 'Image A.png';
var file2 = 'Image B.png';
var file3 = 'Image C.png';
var file4 = 'Image D.png';

// Create a stream of keys. 
var keyStream = s3Files
  .connect({
    region: region,
    bucket: bucket    
  })
  .createKeyStream(folder, [file1, file2, file3, file4]);

// Stream the files. 
s3Files.createFileStream(keyStream)
  .on('data', function (chunk) {
    console.log(chunk.path, chunk.data.length);
  });
```



## Testing

Tests are written in Node Tap, run them like this:

```
npm t
```

If you would like a more fancy report: 

```
npm test -- --cov --coverage-report=lcov
```
