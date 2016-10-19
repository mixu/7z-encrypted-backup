var os = require('os');
var fs = require('fs');
var path = require('path');

module.exports = function archiveTo7z(archive, opts) {
  // Save a temporary file to avoid the limit on the size of arguments to a process.
  var filename = Math.random().toString(36).substring(2) + new Date().getTime().toString(36);
  var filepath = path.join(os.tmpDir(), filename);
  fs.writeFileSync(filepath, archive.files.map(function(file) {
    if (opts.root) {
      return path.relative(opts.root, file.path);
    } else {
      return file.path;
    }
  }).join('\n'));

  var tarCmd = ['tar', 'c', '-T', filepath];
  if (opts.root) {
    tarCmd.push('-C', opts.root);
  }

  return [
    tarCmd,
    ['7z', 'a',
      '-si',
      // Each volume should be 512 mb
      '-v' + (opts.split || '512m'),
      // Archive type = 7z
      '-t7z',
      // Password
      '-p' + opts.password,
      // Compression level 0 = copy
      '-mx=0',
      // AES-256
      // '-mem=AES256', // cannot set ;(
      // Encrypt archive
      '-mhc=on',
      // Encrypt archive header (hide filenames)
      '-mhe=on',
      '-bd',
      // File name
      opts.filename,
    ]
  ];
};
