var DEFAULT_TARGET_SIZE = 512*1024*1024; // 512 mb

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
        archives.push({
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
    archives.push({
      size: currentArchiveSize,
      files: currentArchive,
    });
  }

  return archives;
}
