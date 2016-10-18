var assert = require('assert');
var fixture = require('file-fixture');
var path = require('path');
var spawn = require('child_process').spawn;
var binpath = path.normalize(__dirname + '/../bin/7zeb');

function run(args, onDone) {
  var child = spawn(binpath, args, {
    stdio: ['pipe', process.stdout, process.stderr],
  });
  child.on('error', onDone);
  child.on('exit', function(code) {
    console.log(code);
    onDone();
  });
}
describe('integration', function() {

  var tmpDir = fixture.dir({
    'a/a.txt': 'a',
    'a/b.txt': 'b',
  });

  var outDir = fixture.dirname();

  it('works', function(onDone) {
    run(['--output', outDir, '--password', 'foo', tmpDir], function(err, stdout) {
      if (err) throw err;
      console.log(stdout);
      onDone();
    });
  });

});
