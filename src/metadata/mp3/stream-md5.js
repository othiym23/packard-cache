import { spawn } from 'child_process'

import log from 'npmlog'
import whichAsync from 'which'
import Bluebird from 'bluebird'

const which = Bluebird.promisify(whichAsync)

/**
 * Extract the MD5 hash code of a stream for use in (simple) deduplication. MD5
 * is no longer considered cryptographically secure, but it's the only hashing
 * function compiled into ffmpeg by default that's wide enough to use as an
 * identifier.
 *
 * The MD5 checksum of the whole file includes tags and whatever other
 * non-audio garbage is in the file, so use ffmpeg to hash only the encoded
 * audio data (note the "encoded" part, which explains this particular set of
 * inscrutable options – other ways of extracting the hash code decode the
 * audio first, which is much slower).
 *
 * Note that an early version of this code used either ffmpeg or libav's
 * avconv, but I quickly learned they produce different hash values (my
 * completely uneducated guess is that libav includes frame headers or Xing /
 * Lame tags). The produced hash codes may or may not be portable between
 * versions of ffmpeg and different architectures. I make no guarantees.
 *
 * Also note that this isn't a fingerprint. I don't care about deduplicating
 * different encodings of the same audio, I just want to know when I've got two
 * identical streams, which may or may not include differing metadata tags.
 */
export default function extractStreamMD5 (path) {
  return which('ffmpeg').then(command => {
    const args = [
      '-loglevel', 'error',
      '-i', path,
      // these arguments ensure the stream isn't decoded
      '-c:a', 'copy',
      '-f', 'md5', '-'
    ]

    log.verbose('full command is', [command].concat(args).join(' '))

    return new Bluebird((resolve, reject) => {
      var child = spawn(command, args, { encoding: 'utf8' })

      var stdout = ''
      if (child.stdout) child.stdout.on('data', chunk => { stdout += chunk })

      var stderr = ''
      if (child.stderr) child.stderr.on('data', chunk => { stderr += chunk })

      child.on('error', reject)
      child.on('close', code => {
        if (code !== 0) return reject(new Error(stderr))

        const [type, md5sum] = stdout.trim().split('=')
        if (type !== 'MD5') return reject(new TypeError('Invalid type ' + type))
        resolve(md5sum)
      })
    })
  })
}
