# @packard/cache

A read-through cache for audio stream information and metadata. Uses [`nothingness`](http://npm.im/nothingness) and [`packard`'s](http://npm.im/packard) [model classes](http://npm.im/@packard/model) along with packard's metadata reader streams to extract the information, and then uses `@nothingness/level` to cache the extracted metadata in a LevelDB database.

## API

TBD

### Requirements

- To read encoded mp3 stream hashes, this program uses `ffmpeg`, so it needs to be installed. It should be possible to adapt the program to use libav's `avconv` instead, but first somebody will need to figure out why the two programs produce different MD5 hash codes for the same stream. I just use the version of ffmpeg packaged by Homebrew.
