#!/usr/bin/env node
var os = require('os');
var fs = require('fs');
var path = require('path');
var pi = require('pipe-iterators');
var dirStream = require('./lib/dir-stream');
var hashFile = require('./lib/hash-file');
var filesToArchives = require('./lib/files-to-archives');
var archiveTo7z = require('./lib/archive-to-7z');
var parallel = require('miniq');
var mkdirp = require('mkdirp');
var status = require('./lib/status');
var spawn = require('child_process').spawn;

function run(cmds, onDone) {
  var last = cmds.reduce(function(prev, args) {
    console.error('Running: ' + args.join(' ').substr(0, process.stderr.columns - 1));
    var child = spawn(args[0], args.slice(1));

    if (prev) {
      prev.stdout.pipe(child.stdin);
    }
    child.on('error', onDone);

    return child;
  }, null);

  last.on('exit', function(code) {
    if (code !== 0) {
      return onDone(new Error('Process exited with code ' + code));
    }
    onDone();
  });
}

module.exports = function(dirs, opts) {
  console.log('Creating an archive from: ' + dirs.join(' '));

  mkdirp.sync(opts.output);
  pi.fromArray(dirs)
    .pipe(pi.map(function(dir) {
      return path.resolve(opts.cwd, dir);
    }))
    .pipe(dirStream()) // resolve to files { path: .., stat: .. }
    .pipe(pi.reduce(function(files, file) { return files.concat(file); }, []))
    .pipe(pi.thru.obj(function(files, encoding, onDone) {
      var self = this;
      var result = [];
      parallel(4, files.map(function(file) {
        return function(onDone) {
          status(result.length + '/' + files.length + ' MD5 hashing ' + file.path);
          // calculate md5 hash
          hashFile(file.path, function(err, hash) {
            file.hash = hash;
            file.hashType = 'md5';
            result.push(file);
            onDone(err);
          });
        };
      }), function() {
        status('Done hashing\n');
        self.push(result);
        onDone();
      });
    }))
    .pipe(pi.thru.obj(function(files, encoding, onDone) {
      var self = this;
      var archives = filesToArchives(files);
      archives.map(function(archive) { self.push(archive); });
      // write metadata
      var dirname = Math.random().toString(36).substring(2) + new Date().getTime().toString(36);
      var filepath = path.join(os.tmpDir(), path.join(dirname, 'meta.json'));
      mkdirp.sync(path.join(os.tmpDir(), dirname));
      fs.writeFileSync(filepath, archives.map(function(archive) { return JSON.stringify(archive); }).join('\n'));
      var args = [
        '7z',
        'a',
        // Archive type = 7z
        '-t7z',
        // Password
        '-p' + opts.password,
        // Compression level 9
        '-mx=9',
        // Encrypt archive
        '-mhc=on',
        // Encrypt archive header (hide filenames)
        '-mhe=on',
        '-bd',
        path.join(opts.output, 'meta.json.7z'),
        filepath,
      ];
      run([args], onDone);
    }))
    .pipe(pi.thru.obj(function(archive, encoding, onDone) {
      opts.filename = path.join(opts.output, archive.filename.substr(0, 2), archive.filename);
      if (fs.existsSync(opts.filename + '.001')) {
        console.error('Path exists, skipping ' + opts.filename + '.001');
        onDone();
      } else {
        var args = archiveTo7z(archive, opts);
        run(args, onDone);
      }
    }))
    .pipe(pi.devnull());
};
