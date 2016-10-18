var path = require('path');

module.exports = function archiveTo7z(archive, opts) {
  return [
    'cO',
  ]
  .concat(archive.files.map(function(file) { return '"' + file.path + '"'; }))
  .concat([
    '|',
    '7z',
    'a',
    '-si',
    // Each volume should be 512 mb
    '-v512m',
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
  ]);
};
