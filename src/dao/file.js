import assert from 'assert'

import Bluebird from 'bluebird'
import { cloneDeepWith, isDate } from 'lodash'

import DAO from 'nothingness'
import { File } from '@packard/model'

const GENSYM = Symbol()
const dates = [ 'atime', 'mtime', 'ctime', 'birthtime' ]

export default class FileDAO extends DAO {
  constructor (level) {
    super(level)

    this._get = Bluebird.promisify(level.db.get, { context: level.db })
  }

  findByID (path, cb) {
    return this._get(FileDAO[GENSYM](path))
      .then(found => this._deserialize(found, cb))
      .nodeify(cb)
  }

  _serialize (toSave, cb) {
    assert(toSave, 'must have File to serialize')

    // use date.toString() vs date.toJSON() to ensure time zone is preserved
    let serialized = cloneDeepWith(
      toSave,
      v => isDate(v) ? v.toString() : v
    )

    return super._serialize(serialized, cb)
  }

  _deserialize (loaded, cb) {
    for (let dateField of dates) {
      if (typeof loaded.stats[dateField] === 'string') {
        loaded.stats[dateField] = new Date(loaded.stats[dateField])
      }
    }

    const file = new File(loaded.path, loaded.stats, loaded.ext)
    // required by the _deserialize contract
    this.generateID(file)

    return super._deserialize(file, cb)
  }

  generateID (file) {
    assert(
      file && file.path,
      'must pass file with a path'
    )
    file[DAO.idSymbol] = FileDAO[GENSYM](file.path)
    return file[DAO.idSymbol]
  }

  static [GENSYM] (path) {
    return `file:${path}`
  }
}
