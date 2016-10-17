var assert = require('assert');
var filesToArchives = require('../lib/files-to-archives');

describe('files to archives', function() {

  var fileA = {path: '/a/a', stat: {size: 30}};
  var fileB = {path: '/a/b', stat: {size: 30}};
  var fileC = {path: '/a/c', stat: {size: 30}};


  it('works with folders < target', function() {
    var result = filesToArchives([fileA, fileB], 90);

    assert.deepEqual(result, [{size: 60, files: [fileA, fileB]}]);
  });

  it('works with folders === target', function() {
    var result = filesToArchives([fileA, fileB], 60);

    assert.deepEqual(result, [{size: 60, files: [fileA, fileB]}]);
  });

  it('works with folders > target', function() {
    var result = filesToArchives([fileA, fileB, fileC], 60);

    assert.deepEqual(result, [
      {size: 60, files: [fileA, fileB]},
      {size: 30, files: [fileC]},
    ]);
  });

  it('works with files > target', function() {
    var result = filesToArchives([fileA, fileB], 15);

    assert.deepEqual(result, [
      {size: 30, files: [fileA]},
      {size: 30, files: [fileB]},
    ]);
  });

});
