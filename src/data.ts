import { execFileSync } from 'child_process'
import { Stats, readdirSync, statSync } from 'fs'
import * as R from 'ramda'
import * as RA from 'ramda-adjunct'
import LRU from 'lru-cache'
import { MediaFile, MediaFolder } from './models'
import { existsSync, unlinkSync } from 'fs'
import { renameSync } from 'fs'

const DEFAULT_MEDIA_ROOT = 'x:/'
const DEFAULT_STREAMING_ROOT = 'http://192.168.0.78:8001/'
const DEFAULT_FLAG_FOLDER = 'x:/flagged/'
const DEFAULT_MOVE_FOLDER = 'x:/moved/'
const MOVE_ALL_COMMAND = 'x:/ystream/_move_to_all.bat'

export const ACTION_FLAG = 'FLAG'
export const ACTION_MOVE = 'MOVE'
export const ACTION_MOVE_ALL = 'MOVE_ALL'
export const ACTION_DELETE = 'DELETE'

const lru = new LRU()

export const getMediaRoot = (): string => {
  const folder = process.env.MEDIA_ROOT
  return R.defaultTo(DEFAULT_MEDIA_ROOT, folder)
}

export const getStreamingRoot = (): string => {
  const folder = process.env.STREAMING_ROOT
  return R.defaultTo(DEFAULT_STREAMING_ROOT, folder)
}

export const getFlagFolder = (): string => {
  const folder = process.env.FLAG_FOLDER
  return R.defaultTo(DEFAULT_FLAG_FOLDER, folder)
}

export const getMoveFolder = (): string => {
  const folder = process.env.MOVE_FOLDER
  return R.defaultTo(DEFAULT_MOVE_FOLDER, folder)
}

const buildMediaFolder = (name: string): MediaFolder => {
  return {
    url: getStreamingRoot() + encodeURIComponent(name),
    name,
  }
}

export const mediaFolders: MediaFolder[] = [
  buildMediaFolder('tstream'),
  buildMediaFolder('ustream'),
  buildMediaFolder('wstream'),
  buildMediaFolder('xstream'),
  buildMediaFolder('ystream'),
  buildMediaFolder('zstream'),
]

export const getMediaFiles = (folderPath: string, folderName: string) => {
  const list = readdirSync(folderPath)
  return R.pipe(
    R.map((fileName: string) => getMediaFile(folderName, fileName)),
    RA.compact,
  )(list)
}


const parseDuration = (lines: string[]): number => {
  let duration = 0
  R.forEach((line: string) => {
    line = line.trim()
    if (line.includes('.duration=') && !line.endsWith('"N/A"')) {
      // streams.stream.0.duration="7092.492375"
      duration = Math.floor(parseFloat(line.substring(27, line.length - 2)))
    }
    if (line.includes('.tags.DURATION') && !line.endsWith('"N/A"')) {
      // streams.stream.0.tags.DURATION="01:58:12.492000000"
      let tokens = line.split('=')
      if (tokens.length === 2) {
        const timestamp = tokens[1].substring(1, tokens[1].length - 2)
        const [timestamp1] = timestamp.split('.')
        tokens = timestamp1.split(':')
        let hours = 0
        let minutes = 0
        let seconds = 0
        if (tokens.length === 3) {
          hours = parseInt(tokens[0], 10)
          minutes = parseInt(tokens[1], 10)
          seconds = parseInt(tokens[2], 10)
        }
        else if (tokens.length === 2) {
          minutes = parseInt(tokens[0], 10)
          seconds = parseInt(tokens[1], 10)
        }
        else if (tokens.length === 1) {
          seconds = parseInt(tokens[0], 10)
        }
        duration = hours * 3600 + minutes * 60 + seconds
      }
    }
  }, lines)
  // console.log(`parseDuration ->`, duration)
  return duration
}

const getDuration = (path: string, stat: Stats): number => {
  const cacheKey = `${path} | ${stat.size} | ${stat.mtime}`
  let duration = lru.get(cacheKey)
  if (duration) {
    return duration as number
  }
  // const command = `D:/GoogleDrive/Workspace/AutoRecode/exe/ffprobe.exe -hide_banner -v quiet -show_streams -print_format -flat "${path}"`
  const lines = execFileSync('D:/GoogleDrive/Workspace/AutoRecode/exe/ffprobe.exe', [
      '-hide_banner',
      '-v',
      'quiet',
      '-show_streams',
      '-print_format',
      'flat',
      path,
    ]
  ).toString().split('\n')
  duration = parseDuration(lines)
  if (duration) {
    lru.set(cacheKey, duration)
  }
  return duration as number
}

export const getMediaFile = (folderName: string, fileName: string): MediaFile | undefined => {
  if (fileName.endsWith('.mp4') || fileName.endsWith('.m4')) {
    const path = getMediaRoot() + folderName + '/' + fileName
    const stat = statSync(path)
    return {
      url: getStreamingRoot() + encodeURIComponent(folderName)  + '/' + encodeURIComponent(fileName),
      fileSize: stat.size,
      lastModified: stat.mtime.getTime(),
      duration: getDuration(path, stat),
    }
  }
  return undefined
}

const parseMediaFileName = (url: string): string[] => {
  let folder = ''
  let name = ''
  if (url) {
    const tokens = url.split('/')
    if (tokens.length > 2) {
      folder = decodeURIComponent(tokens[tokens.length - 2])
      name = decodeURIComponent(tokens[tokens.length - 1])
    }
  }
  return [folder, name]
}

export const flagFiles = (list: string[]) => {
  R.forEach(url => {
    const [folderName, fileName] = parseMediaFileName(url)
    if (folderName && fileName) {
      const folder = R.find(R.propEq('name', folderName), mediaFolders)
      if (folder) {
        const path = getMediaRoot() + folderName + '/' + fileName
        const target = getFlagFolder() + fileName
        if (existsSync(path) && !existsSync(target)) {
          renameSync(path, target)
        }
      }
    }
  }, list)
}

export const moveFiles = (list: string[]) => {
  R.forEach(url => {
    const [folderName, fileName] = parseMediaFileName(url)
    if (folderName && fileName) {
      const folder = R.find(R.propEq('name', folderName), mediaFolders)
      if (folder) {
        const path = getMediaRoot() + folderName + '/' + fileName
        const target = getMoveFolder() + fileName
        if (existsSync(path) && !existsSync(target)) {
          renameSync(path, target)
        }
      }
    }
  }, list)
}

export const deleteFiles = (list: string[]) => {
  R.forEach(url => {
    const [folderName, fileName] = parseMediaFileName(url)
    if (folderName && fileName) {
      const folder = R.find(R.propEq('name', folderName), mediaFolders)
      if (folder) {
        const path = getMediaRoot() + folderName + '/' + fileName
        if (existsSync(path)) {
          unlinkSync(path)
        }
      }
    }
  }, list)
}

export const moveAllFiles = () => {
  try {
    execFileSync(MOVE_ALL_COMMAND)
  }
  catch (ex) {
  }
}
