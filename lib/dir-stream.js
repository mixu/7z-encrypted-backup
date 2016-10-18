var fs = require('fs'),
    path = require('path'),
    pi = require('pipe-iterators');

module.exports = function() {
  return pi.thru.obj(function(filepath, enc, done) {

    var currentPaths = [filepath];
    var depth = 0;
    var nextPaths = [];
    var i = 0;
    var total = currentPaths.length;
    var stderr = process.stderr;
    while (currentPaths.length > 0) {
      var p = currentPaths.shift();
      i++;
      if (stderr.isTTY) {
        stderr.cursorTo(0);
        var str = i + '/' + total + ' Scanning ' + p + '/* (depth ' + (depth + 1) + ')';
        stderr.write(str.substr(0, stderr.columns));
        stderr.clearLine(1);
      }
      try {
        var paths = fs.readdirSync(p);

        paths.forEach(function(name) {
          var filepath = path.join(p, name);
          var stat = fs.statSync(filepath);

          if (stat.isDirectory()) {
            nextPaths.push(filepath);
          } else if (stat.isFile()) {
            this.push({ path: filepath, stat: stat });
          }
        }, this);
      } catch (e) {
        // ignore ENOENT (can occur with bad symlinks)
        // and EACCESS (can occur with superuser-permission paths)
        if (e.code !== 'ENOENT' && e.code !== 'EACCES') {
          throw e;
        }
      }
      if (currentPaths.length === 0) {
        depth++;
        total += nextPaths.length;
        currentPaths = nextPaths;
        nextPaths = [];
      }
    }
    if (stderr.isTTY) {
      stderr.write('\n');
    }

    done();
  });
};
