require('babel-polyfill')

var join = require('path').join

var mkdirp = require('mkdirp')
var rimraf = require('rimraf')
var test = require('tap').test
var Bluebird = require('bluebird')

var Adaptor = require('@nothingness/level').default

var TagDAO = require('../').TagDAO

var PLAYGROUND = join(__dirname, 'tag-test-db')

test('setup', function (t) {
  setup()
  t.end()
})

test('can round trip tags via the DAO', function (t) {
  var dao = new TagDAO(new Adaptor(PLAYGROUND))
  var lostPath = '/Volumes/S8 food/latest-flac-2/Falling Skies/Land of the Lost  Tremor/01 Land of the Lost.flac'

  var flacTags = {
    ACOUSTID_ID: 'a72e260e-a55d-4fdf-b16b-a27922eb2907',
    ALBUM: 'Land of the Lost / Tremor',
    ALBUMARTIST: 'Falling Skies',
    ALBUMARTISTSORT: 'Falling Skies',
    ARTIST: 'Falling Skies',
    ARTISTS: 'Falling Skies',
    ARTISTSORT: 'Falling Skies',
    ASIN: 'B00XDCWU5K',
    CATALOGNUMBER: 'SMG 006D',
    DATE: '2015-06-01',
    DISCNUMBER: '1',
    DISCTOTAL: '1',
    ENCODER: 'X Lossless Decoder 20141129',
    GENRE: "Drum'n'Bass",
    LABEL: 'Samurai Music',
    MEDIA: 'Digital Media',
    ORIGINALDATE: '2015-06-01',
    ORIGINALYEAR: '2015',
    RELEASECOUNTRY: 'XW',
    RELEASESTATUS: 'official',
    RELEASETYPE: 'single',
    SCRIPT: 'Latn',
    TITLE: 'Land of the Lost',
    TOTALDISCS: '1',
    TOTALTRACKS: '2',
    TRACKNUMBER: '1',
    TRACKTOTAL: '2'
  }

  var flacMap = new Map(Object.keys(flacTags).map(function (e) { return [e, flacTags[e]] }))

  return Bluebird.mapSeries(
    flacMap,
    function (e) { return dao.save({ path: lostPath, type: e[0], value: e[1] }) }
  ).then(function () {
    var all = dao.findAll().then(function (tags) {
      t.is(tags.length, 27, '27 tags in DB')
    })

    var byPath = all.then(function () { return dao.findByPath(lostPath) })
      .then(function (tags) {
        t.is(tags.size, 27, '27 tags associated with ' + lostPath)
      })

    var byGenre = byPath.then(function () { return dao.findByTagType('GENRE') })
      .then(function (tags) {
        t.is(tags.size, 1, 'one genre')
        t.same(
          tags.values().next().value,
          { path: lostPath, type: 'GENRE', value: "Drum'n'Bass" }
        )
      })

    return byGenre
  })
})

test('cleanup', function (t) {
  cleanup()
  t.end()
})

function setup () {
  cleanup()
  mkdirp.sync(PLAYGROUND)
}

function cleanup () {
  rimraf.sync(PLAYGROUND)
}
