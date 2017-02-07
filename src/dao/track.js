import assert from 'assert'

import Bluebird from 'bluebird'
import { cloneDeep } from 'lodash'

import Adaptor from '@nothingness/level'
import DAO from 'nothingness'

import FileDAO from './file.js'

const GENSYM = Symbol()

export default class TrackDAO extends DAO {
  constructor (level) {
    super(level)

    this._fileDAO = new FileDAO(level)
    this._get = Bluebird.promisify(level.db.get, { context: level.db })
  }

  findByID (path, cb) {
    return this._get(TrackDAO[GENSYM](path)).nodeify(cb)
  }

  _serialize (toSave, cb) {
    assert(toSave, 'must have Track to serialize')

    let serialized = cloneDeep(toSave)
    delete serialized.file

    return this._fileDAO.save(toSave.file)
                        .then(() => super._serialize(serialized, cb))
  }

  _deserialize (loaded, cb) {
    return this
      ._fileDAO.findByID(loaded.path)
      .then((file) => {
        loaded.file = file
        return super._deserialize(loaded, cb)
      })
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
