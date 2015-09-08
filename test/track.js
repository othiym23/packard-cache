var dirname = require('path').dirname
var join = require('path').join

var mkdirp = require('mkdirp')
var rimraf = require('rimraf')
var test = require('tap').test

var model = require('@packard/model')
var Album = model.Album
var Artist = model.Artist
var AudioFile = model.AudioFile
var Track = model.Track

var TrackDAO = require('../').TrackDAO

var PLAYGROUND = join(__dirname, 'track-test-db')

test('setup', function (t) {
  setup()
  t.end()
})

test('can round trip a full track via the DAO', function (t) {
  var dao = new TrackDAO(PLAYGROUND)
  var lostPath = '/Volumes/S8 food/latest-flac-2/Falling Skies/Land of the Lost  Tremor/01 Land of the Lost.flac'
  var artist = new Artist('Falling Skies')
  var album = new Album(
    'Land of the Lost / Tremor',
    artist,
    {
      date: '2015-06-01',
      path: dirname(lostPath)
    }
  )

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

  // FLAC stream data
  var streamData = {
    minBlockSize: 4096,
    maxBlockSize: 4096,
    minFrameSize: 2666,
    maxFrameSize: 13930,
    sampleRate: 44100,
    channels: 2,
    bitsPerSample: 16,
    samplesInStream: 17432473,
    duration: 395.29417233560093,
    iTunes_CDDB_1: '1502A802+51182+2+150+29797',
    bytesToFirstFrame: 101641
  }

  var file = new AudioFile(lostPath, stats, { streamData: streamData })

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

  var musicbrainzTags = {
    MUSICBRAINZ_ALBUMARTISTID: '3e204c36-f308-49ea-9f16-882b5a6ea4ed',
    MUSICBRAINZ_ALBUMID: 'a05ac22d-363f-474d-91f8-b217efad09bd',
    MUSICBRAINZ_ARTISTID: '3e204c36-f308-49ea-9f16-882b5a6ea4ed',
    MUSICBRAINZ_RELEASEGROUPID: '4120e058-d82d-40ca-ad85-0d957b169498',
    MUSICBRAINZ_RELEASETRACKID: 'ff3f2e7f-b0f2-45dd-a5e7-607f190958bb',
    MUSICBRAINZ_TRACKID: 'fec8977e-17d0-4580-8eab-dfe8359ff4c4'
  }

  var track = new Track(
    'Land of the Lost',
    album,
    artist,
    {
      index: 1,
      disc: 1,
      date: '2015-06-01',
      duration: 395.29417233560093,
      flacTags: flacTags,
      musicbrainzTags: musicbrainzTags,
      file: file
    }
  )
  dao.save(track, function (er) {
    t.ifError(er, 'track saved')

    dao.findByID(track.file.path, function (er, saved) {
      t.ifError(er, 'track reconstituted')
      t.same(track, saved)

      t.end()
    })
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
