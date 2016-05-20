import assert from 'assert'

import Bluebird from 'bluebird'

import Adaptor from '@nothingness/level'
import DAO from 'nothingness'

const GENSYM = Symbol()

export default class TrackDAO extends DAO {
  constructor (levelPath) {
    const level = new Adaptor(levelPath)
    super(level)

    this._get = Bluebird.promisify(level.db.get, { context: level.db })
  }

  findByID (path, cb) {
    return this._get(TrackDAO[GENSYM](path)).nodeify(cb)
  }

  generateID (track) {
    assert(
      track && track.file && track.file.path,
      'must pass track associated with a file'
    )
    track[DAO.idSymbol] = TrackDAO[GENSYM](track.file.path)
    return track[DAO.idSymbol]
  }

  // gonna use the whole buffalo
  static [GENSYM] (path) {
    return `track:${path}`
  }
}
