var join = require('path').join
var test = require('tap').test

var extractStreamMD5 = require('../lib/metadata/mp3/stream-md5.js').default

var testFile = join(__dirname, 'fixtures', 'empty.mp3')

test('extracting SHA256 of encoded MPEG-2 layer III stream', function (t) {
  return extractStreamMD5(testFile)
    .then(function (md5sum) { t.is(md5sum, '830971d254622794c727bc86ae2e11a8') })
})
