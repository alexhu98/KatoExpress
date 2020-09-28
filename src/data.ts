import fs from 'fs'
import cp from 'child_process'
import util from 'util'
import * as R from 'ramda'
import LRU from 'lru-cache'
import { MediaFile, MediaFolder } from './models'

const DEFAULT_MEDIA_ROOT = 'x:/'
const DEFAULT_STREAMING_ROOT = 'http://192.168.0.78:8001/'
const DEFAULT_FLAG_FOLDER = 'x:/flagged/'
const DEFAULT_MOVE_FOLDER = 'x:/moved/'
const MOVE_ALL_COMMAND = 'x:/ystream/_move_to_all.bat'

export const ACTION_FLAG = 'FLAG'
export const ACTION_MOVE = 'MOVE'
export const ACTION_MOVE_ALL = 'MOVE_ALL'
export const ACTION_DELETE = 'DELETE'

const CACHE_MAX = 1000
const lru = new LRU<string, number>(CACHE_MAX)

const fsp = fs.promises

export const exists = async (path: string): Promise<boolean> => {
  try {
    await fsp.stat(path)
    return true
  }
  catch (ex) {
  }
  return false
}

const execFile = util.promisify(cp.execFile)

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

export const getMediaFiles = async (folderPath: string, folderName: string) => {
  const result: MediaFile[] = []
  try {
    const list = await fsp.readdir(folderPath)
    for (const fileName of list) {
      const mediaFile = await getMediaFile(folderName, fileName)
      if (mediaFile) {
        result.push(mediaFile)
      }
    }
  }
  catch (ex) {
    console.error(`getMediaFiles() -> ${folderPath} ex`, ex)
  }
  return result
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
  // console.log(`parseDuration() ->`, duration)
  return duration
}

const getDuration = async (path: string, stat: fs.Stats): Promise<number> => {
  const cacheKey = `${path} | ${stat.size} | ${stat.mtime}`
  let duration = lru.get(cacheKey)
  if (duration) {
    return duration
  }
  try {
    const { stdout } = await execFile('D:/GoogleDrive/Workspace/AutoRecode/exe/ffprobe.exe', [
        '-hide_banner',
        '-v',
        'quiet',
        '-show_streams',
        '-print_format',
        'flat',
        path,
      ]
    )
    if (stdout) {
      const lines = stdout.toString().split('\n')
      duration = parseDuration(lines)
    }
  }
  catch (ex) {
    console.error('getDuration() ex')
  }
  if (duration) {
    lru.set(cacheKey, duration)
  }
  else {
    duration = 0
  }
  return duration
}

export const getMediaFile = async (folderName: string, fileName: string): Promise<MediaFile | undefined> => {
  if (fileName.endsWith('.mp4') || fileName.endsWith('.m4')) {
    const path = getMediaRoot() + folderName + '/' + fileName
    try {
      const stat = await fsp.stat(path)
      const duration = await getDuration(path, stat)
      return {
        url: getStreamingRoot() + encodeURIComponent(folderName)  + '/' + encodeURIComponent(fileName),
        fileSize: stat.size,
        lastModified: stat.mtime.getTime(),
        duration,
      }
    }
    catch (ex) {
      console.error(`getMediaFile() ${folderName} ${fileName}`, ex)
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

export const flagFiles = async (list: string[]) => {
  for (const url of list) {
    const [folderName, fileName] = parseMediaFileName(url)
    if (folderName && fileName) {
      const folder = R.find(R.propEq('name', folderName), mediaFolders)
      if (folder) {
        try {
          const path = getMediaRoot() + folderName + '/' + fileName
          const target = getFlagFolder() + fileName
          const oldExists = await exists(path)
          const newExists = await exists(target)
          if (oldExists && !newExists) {
            await fsp.rename(path, target)
          }
        }
        catch (ex) {
          console.error(`flagFiles() ex`, ex)
        }
      }
    }
  }
}

export const moveFiles = async (list: string[]) => {
  for (const url of list) {
    const [folderName, fileName] = parseMediaFileName(url)
    if (folderName && fileName) {
      const folder = R.find(R.propEq('name', folderName), mediaFolders)
      if (folder) {
        try {
          const path = getMediaRoot() + folderName + '/' + fileName
          const target = getMoveFolder() + fileName
          const oldExists = await exists(path)
          const newExists = await exists(target)
          if (oldExists && !newExists) {
            await fsp.rename(path, target)
          }
        }
        catch (ex) {
          console.error(`moveFiles() ex`, ex)
        }
      }
    }
  }
}

export const deleteFiles = async (list: string[]) => {
  for (const url of list) {
    const [folderName, fileName] = parseMediaFileName(url)
    if (folderName && fileName) {
      const folder = R.find(R.propEq('name', folderName), mediaFolders)
      if (folder) {
        try {
          const path = getMediaRoot() + folderName + '/' + fileName
          const pathExists = await exists(path)
          if (pathExists) {
            await fsp.unlink(path)
          }
        }
        catch (ex) {
          console.error(`deleteFiles() ex`, ex)
        }
      }
    }
  }
}

export const moveAllFiles = async () => {
  try {
    await execFile(MOVE_ALL_COMMAND)
  }
  catch (ex) {
  }
}
