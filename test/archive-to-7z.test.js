var assert = require('assert');
var archiveTo7z = require('../lib/archive-to-7z');

describe('archive to 7z', function() {

  it('works', function() {
    var fileB = {path: '/a/b', stat: {size: 30}, hash: 'a'};
    var fileA = {path: '/a/a', stat: {size: 30}, hash: 'b'};

    console.log(archiveTo7z({size: 60, files: [fileA, fileB]}, {
      password: 'foobar',
    }));
  });
});
