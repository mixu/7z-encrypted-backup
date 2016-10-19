var fs = require('fs');
var crypto = require('crypto');

module.exports = function hashFile(filePath, onDone) {
  var file = fs.createReadStream(filePath);
  var hash = crypto.createHash('md5');
  hash.setEncoding('hex');

  file.on('error', onDone);
  file.on('end', function() {
    hash.end();
    onDone(null, hash.read());
  });
  file.pipe(hash);
};
