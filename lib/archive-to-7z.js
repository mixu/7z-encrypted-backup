var crypto = require('crypto');

function md5(str) {
  return crypto.createHash('md5').update(data).digest('hex');
}

module.exports = function archiveTo7z(archive, opts) {
  // generate the file name based on md5(concat(file hashes))
  var fileName = archive.files.map(function(file) { return file.hash; }).sort().join('');

  return [
    '7z',
    'a',
    // Archive type = 7z
    '-t7z',
    filename,
    // Password
    '-p',
    opts.password,
    // Compression level 0 = copy
    '-mx=0',
    // AES-256
    '-mem=AES256',
    // Encrypt archive
    '-mhc=on',
    // Encrypt archive header (hide filenames)
    '-mhe=on',
    // Each volume should be 512 mb
    '-v512m',
  ].concat(archive.files.map(function(file) { return file.path; });
};
