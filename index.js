#!/usr/bin/env node
var fs = require('fs');
var path = require('path');
var pi = require('pipe-iterators');
var dirStream = require('./lib/dir-stream');
var hashFile = require('./lib/hash-file');

var dirs = process.argv.slice(2);
var CWD = process.cwd();
pi.fromArray(dirs)
  .pipe(pi.map(function(dir) {
    return path.resolve(CWD, dir);
  }))
  .pipe(dirStream()) // resolve to files { path: .., stat: .. }
  .pipe(pi.parallel(4, function(file, encoding, onDone) {
    var self = this;
    // calculate md5 hash
    hashFile(file.path, function(err, hash) {
      file.hash = hash;
      file.hashType = 'md5';
      self.push(file);
      onDone(err);
    });
  }))
  .pipe(pi.forEach(function(file) {
    console.log(file);
  }))
  .pipe(pi.devnull());


