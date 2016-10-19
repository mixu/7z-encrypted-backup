var DEFAULT_TARGET_SIZE = 512*1024*1024; // 512 mb

var crypto = require('crypto');

function md5(str) {
  return crypto.createHash('md5').update(str).digest('hex');
}

module.exports = function filesToArchives(files, targetSize) {
  targetSize = targetSize || DEFAULT_TARGET_SIZE;
  var remaining = files.slice(0).sort(function(a, b) {
    return a.path.localeCompare(b.path);
  });

  var archives = [];
  var currentArchive = [];
  var currentArchiveSize = 0;

  while (remaining.length > 0) {
    if (currentArchiveSize + remaining[0].stat.size > targetSize) {
      if (currentArchive.length > 0) {
        // generate the file name based on md5(concat(file hashes))
        var filename = md5(currentArchive.map(function(file) { return file.hash; }).sort().join('')) + '.tar.7z';
        archives.push({
          filename: filename,
          size: currentArchiveSize,
          files: currentArchive,
        });
      }
      currentArchiveSize = remaining[0].stat.size;
      currentArchive = [remaining.shift()];
    } else {
      currentArchiveSize += remaining[0].stat.size;
      currentArchive.push(remaining.shift());
    }
  }

  if (currentArchive.length > 0) {
    var filename = md5(currentArchive.map(function(file) { return file.hash; }).sort().join('')) + '.tar.7z';
    archives.push({
      filename: filename,
      size: currentArchiveSize,
      files: currentArchive,
    });
  }

  return archives;
}
