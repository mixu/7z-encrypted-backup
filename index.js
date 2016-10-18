#!/usr/bin/env node
var fs = require('fs');
var path = require('path');
var pi = require('pipe-iterators');
var dirStream = require('./lib/dir-stream');
var hashFile = require('./lib/hash-file');
var filesToArchives = require('./lib/files-to-archives');
var archiveTo7z = require('./lib/archive-to-7z');

var exec = require('child_process').exec;
function run(cmd, args, stdin, onDone) {
  if (typeof stdin === 'function') {
    onDone = stdin;
    stdin = null;
  }
  console.log('Running: ' + [cmd].concat(args).join(' '));
  var child = exec([cmd].concat(args).join(' '));
  child.on('error', onDone);
  child.on('exit', function(code) {
    if (code !== 0) {
      return onDone(new Error('Running: 7z ' + args.join(' ') + ' - process exited with code ' + code));
    }
    onDone();
  });

  if (stdin) {
    child.stdin.end(stdin);
  }
}

var crypto = require('crypto');

function md5(str) {
  return crypto.createHash('md5').update(str).digest('hex');
}

module.exports = function(dirs, opts) {
  console.log(dirs);

  pi.fromArray(dirs)
    .pipe(pi.map(function(dir) {
      return path.resolve(opts.cwd, dir);
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
    .pipe(pi.reduce(function(files, file) { return files.concat(file); }, []))
    .pipe(pi.thru.obj(function(files, encoding, onDone) {
      var self = this;
      var archives = filesToArchives(files);
      archives.map(function(archive) { self.push(archive); });
      // write metadata
      var args = [
        'a',
        // Archive type = 7z
        '-t7z',
        // Password
        '-p' + opts.password,
        // Compression level 0 = copy
        '-mx=0',
        // Encrypt archive
        '-mhc=on',
        // Encrypt archive header (hide filenames)
        '-mhe=on',
        '-si',
        '-bd',
        path.join(opts.output, 'meta.json.7z')
      ];
      run('7z', args, JSON.stringify(archives, null, 2), onDone);
    }))
    .pipe(pi.thru.obj(function(archive, encoding, onDone) {
      // generate the file name based on md5(concat(file hashes))
      var filename = md5(archive.files.map(function(file) { return file.hash; }).sort().join('')) + '.tar.7z';
      opts.filename = path.join(opts.output, filename.substr(0, 2), filename);
      if (fs.existsSync(opts.filename + '.001')) {
        console.log('Path exists, skipping ' + opts.filename + '.001');
        onDone();
      } else {
        var args = archiveTo7z(archive, opts);
        run('tar', args, onDone);
      }
    }))
    .pipe(pi.devnull());
};
