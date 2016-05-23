var join = require('path').join
var statAsync = require('fs').stat
var writeFileAsync = require('fs').writeFile

var mkdirpAsync = require('mkdirp')
var rimrafAsync = require('rimraf')
var test = require('tap').test
var Bluebird = require('bluebird')

var mkdirp = Bluebird.promisify(mkdirpAsync)
var rimraf = Bluebird.promisify(rimrafAsync)

var model = require('@packard/model')
var File = model.File

var FileDAO = require('../').FileDAO

var stat = Bluebird.promisify(statAsync)
var writeFile = Bluebird.promisify(writeFileAsync)

var PLAYGROUND = join(__dirname, 'file-test-db')
var WORKING = join(__dirname, 'file-test-working')
var dao

test('setup', setup)

test('can serialize the output of stat', function (t) {
  dao = new FileDAO(PLAYGROUND)
  var testFilePath = join(WORKING, 'hi')

  var statted = writeFile(testFilePath, "how's it going?")
    .then(function () { return stat(testFilePath) })

  var compared = statted.then(function (stats) {
    var testFile = new File(testFilePath, stats)
    return dao.save(testFile)
      .then(function () { return dao.findByID(testFilePath) })
      .then(function (found) { t.same(found, testFile) })
  })

  return compared
})

test('setup again', setup)

test('can round trip basic file metadata via the DAO', function (t) {
  dao = new FileDAO(PLAYGROUND)

  var lostPath = '/Volumes/S8 food/latest-flac-2/Falling Skies/Land of the Lost  Tremor/01 Land of the Lost.flac'
  var stats = {
    dev: 16777224,
    mode: 33188,
    nlink: 1,
    uid: 501,
    gid: 20,
    rdev: 0,
    blksize: 4096,
    ino: 259317,
    size: 43987851,
    blocks: 85920,
    atime: new Date('Thu Sep 03 2015 15:57:08 GMT-0700 (PDT)'),
    mtime: new Date('Mon Jul 27 2015 23:03:18 GMT-0700 (PDT)'),
    ctime: new Date('Mon Jul 27 2015 23:15:18 GMT-0700 (PDT)'),
    birthtime: new Date('Mon Jul 27 2015 18:08:35 GMT-0700 (PDT)')
  }
  var lostFile = new File(lostPath, stats)

  var saved = dao.save(lostFile)
    .then(function () { return dao.findByID(lostPath) })
    .then(function (found) { t.same(found, lostFile) })

  return saved
})

test('cleanup', cleanup)

function setup () {
  return cleanup()
    .then(function () {
      Bluebird.all([
        mkdirp(PLAYGROUND),
        mkdirp(WORKING)
      ])
    })
}

function cleanup () {
  var closed = Promise.resolve()
  if (dao) closed = dao.closeDB()

  return closed
    .then(function () {
      dao = null
      return Bluebird.all([
        rimraf(PLAYGROUND),
        rimraf(WORKING)
      ])
    })
}
