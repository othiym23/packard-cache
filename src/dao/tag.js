import 'babel-polyfill'

import assert from 'assert'

import minimatch from 'minimatch'
import Bluebird from 'bluebird'
import { fingerprint64 } from 'farmhash'

import DAO from 'nothingness'

const GENSYM = Symbol()

export default class TagDAO extends DAO {
  constructor (level) {
    super(level)

    this._scan = level.db.createReadStream.bind(level.db)
  }

  findByPath (path, cb) {
    const hashed = fingerprint64(path)
    const gte = `tag:${hashed}:`
    const lt = `tag:${hashed};`

    return new Bluebird((resolve, reject) => {
      const tags = new Set()
      this._scan({ gte, lt })
        .on('error', reject)
        .on('end', () => resolve(tags))
        .on('data', ({ value }) => tags.add(value))
    }).nodeify(cb)
  }

  findByTagType (type, cb) {
    const pattern = `tag:*:${type}:*`

    return new Bluebird((resolve, reject) => {
      const tags = new Set()
      this._scan()
        .on('error', reject)
        .on('end', () => resolve(tags))
        .on('data', ({key, value}) => {
          if (minimatch(key, pattern)) tags.add(value)
        })
    }).nodeify(cb)
  }

  generateID (tag) {
    assert(
      tag && tag.path && tag.type && tag.value,
      'must pass object with a file path, a tag type, and a tag value'
    )
    tag[DAO.idSymbol] = TagDAO[GENSYM](tag.path, tag.type, tag.value)
    return tag[DAO.idSymbol]
  }

  /**
   * A track is associated with a file. A track will commonly have
   * 1 or more metadata tags. A metadata tag identified by a type string
   * may have one or more values, or there may be more than one tag frame
   * of the same type in a given file. Therefore, to define a natural key
   * that satisfies the requirements of third (and higher) normal form(s),
   * the key must be composite, and must encompass all of:
   *
   * - the file ID (determined by the file's path)
   * - the metadata tag (frame) ID (determined by the file's name)
   * - the metadata value (determined by itself)
   *
   * One of the goals of this project is to avoid using surrogate keys whenever
   * possible, so the key generator must in some way produce true natural,
   * composite keys. The file path and the tag value can both be quite long.
   * Although leveldb imposes no constraints on key length, there's no reason
   * to include the entirety of long values in the key. Instead, use a fast
   * hash on them both and save the unhashed values as attributes in the
   * (serialized) value. This is close enough to domain-key normal form for the
   * purposes of this project.
   *
   * I normally use murmur as my fast hash -- it has an even distribution, it's
   * fast, and its set of operations and bit widths is JIT-friendly. (It's not
   * cryptographically secure, but that's not a concern for this use.) However,
   * there are now native bindings for the C++ implementation of Google's
   * Farmhash family of functions, and the 64-bit versions produce strings as
   * output, thus removing a marshalling / coercion step. I'm using
   * `fingerprint64` because it's specifically designed to be portable across
   * architectures. If this proves to be too slow (given the application, this
   * is extremely unlikely), I can switch back to a native JS murmur.
   *
   * One constraint that can't be handled by this schema is duplicate tags
   * containing the same value. This is true pretty much by definition;
   * duplicate tuples are disallowed in relations by third normal form
   * explicitly. This would only be necessary if I were, like, _super_ anal
   * about being able to round-trip metadata (there are all kinds of MP3 files
   * with duplicate ID3v2 frames out there), but that can be handled by passing
   * in the value as an array. To support that, the value is first serialized
   * as JSON. Fortunately, the finders are only going to generate a subset of
   * the key, and it seems unlikely to me that I'm going to want to scan tags
   * by value.
   *
   * Because the value is serialized to JSON, it can have a finer-grained
   * object structure than just a plain string. It's up to callers to determine
   * how that structure is marshaled and unmarshaled back to its native
   * representation. It's probably not a great idea to store values of more
   * than a few hundred kilobytes this way, so larger pictures or synchronized
   * lyric sheets should probably be stored as references to blobs stored
   * outside the database.
   */
  static [GENSYM] (path, type, value) {
    return `tag:${fingerprint64(path)}:${type}:${fingerprint64(JSON.stringify(value))}`
  }
}
