var sinon = require('sinon')
var t = require('tap')
var PassThrough = require('stream').PassThrough

var proxyquire = require('proxyquire')
var s3Stub = {}
var s3Files = proxyquire('../s3-files.js', {
  'aws-sdk': { 'S3': sinon.stub().returns(s3Stub) }
})

// Connect
t.type(s3Files.s3, undefined)
s3Files.connect({})
t.type(s3Files.s3, 'object')

// Keystream
var keyStream = s3Files.createKeyStream('folder', undefined)
t.same(keyStream, null)

t.test('keyStream', function (child) {
  var keyStream = s3Files.createKeyStream('folder/', ['a', 'b'])
  var cnt = 0
  keyStream.on('data', function (chunk) {
    if (cnt === 0) child.equal(chunk.toString(), 'folder/a')
    if (cnt === 1) child.equal(chunk.toString(), 'folder/b')
    cnt++
  })
  keyStream.on('end', function () {
    child.end()
  })
})

t.test('keyStream without folder having trailing slash', function (child) {
  var keyStream = s3Files.createKeyStream('folder', ['a', 'b'])
  var cnt = 0
  keyStream.on('data', function (chunk) {
    if (cnt === 0) child.equal(chunk.toString(), 'folder/a')
    if (cnt === 1) child.equal(chunk.toString(), 'folder/b')
    cnt++
  })
  keyStream.on('end', function () {
    child.end()
  })
})

t.test('keyStream without folder', function (child) {
  var keyStream = s3Files.createKeyStream('', ['a', 'b'])
  var cnt = 0
  keyStream.on('data', function (chunk) {
    if (cnt === 0) child.equal(chunk.toString(), 'a')
    if (cnt === 1) child.equal(chunk.toString(), 'b')
    cnt++
  })
  keyStream.on('end', function () {
    child.end()
  })
})

// Filestream
t.test('Filestream needs a bucket', function (child) {
  var fileStream = s3Files.createFileStream()
  child.same(fileStream, null)

  var keyStream = s3Files
    .connect({ bucket: 'bucket' })
    .createKeyStream('folder/', ['a', 'b', 'c'])

  var s = new PassThrough()
  s.end('hi')
  var readStream = { createReadStream: function () { return s } }
  s3Stub.getObject = function () { return readStream }
  var cnt = 0
  fileStream = s3Files.createFileStream(keyStream)
  fileStream.on('data', function (chunk) {
    child.equal(chunk.data.toString(), 'hi')
    if (cnt === 0) child.equal(chunk.path, 'a')
    if (cnt === 1) {
      child.equal(chunk.path, 'b')
    }
    if (cnt === 2) {
      s.emit('error', new Error('fail'))
    }
    cnt++
  })
  fileStream.on('error', function (chunk) {
    child.ok(chunk)
  })
  fileStream.on('end', function (chunk) {
    setTimeout(function () {
      child.end()
    })
  })
})

t.end()
