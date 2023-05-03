const Stream = require("stream");
//var AWS = require('aws-sdk')
const AWSS3 = require("@aws-sdk/client-s3");

const streamify = require("stream-array");
const concat = require("concat-stream");
const path = require("path");

const s3Files = {};

module.exports = s3Files;

s3Files.connect = function (opts) {
  const self = this;

  if ("s3client" in opts) {
    self.s3client = opts.s3client;
  } else {
    const s3client = new AWSS3.S3Client({
      region: opts.region,
      credentials: {
        accessKeyId: opts.key,
        secretAccessKey: opts.secret,
      },
    });
    self.s3client = s3client;
  }

  self.bucket = opts.bucket;
  return self;
};

s3Files.createKeyStream = function (folder, keys) {
  if (!keys) return null;
  const paths = [];
  keys.forEach(function (key) {
    if (folder) {
      paths.push(path.posix.join(folder, key));
    } else {
      paths.push(key);
    }
  });
  return streamify(paths);
};

s3Files.createFileStream = function (keyStream, preserveFolderPath) {
  const self = this;
  if (!self.bucket) return null;

  const rs = new Stream();
  rs.readable = true;

  let fileCounter = 0;
  keyStream.on("data", async function (file) {
    fileCounter += 1;
    if (fileCounter > 5) {
      keyStream.pause(); // we add some 'throttling' there
    }

    // console.log('->file', file);

    try {
      const params = { Bucket: self.bucket, Key: file };
      const command = new AWSS3.GetObjectCommand(params);

      const s3Item = await self.s3client.send(command);

      const s3File = s3Item.Body;

      s3File.pipe(
        concat(function buffersEmit(buffer) {
          // console.log('buffers concatenated, emit data for ', file);
          var path = preserveFolderPath ? file : file.replace(/^.*[\\/]/, "");
          rs.emit("data", { data: buffer, path: path });
        })
      );

      s3File.on("end", function () {
        fileCounter -= 1;
        if (keyStream.isPaused()) {
          keyStream.resume();
        }
        if (fileCounter < 1) {
          // console.log('all files processed, emit end');
          rs.emit("end");
        }
      });

      s3File.on("error", function (err) {
        err.file = file;
        rs.emit("error", err);
      });
    } catch (err) {
      console.log(err);
    }
  });

  return rs;
};
