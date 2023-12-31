import fs from 'fs'
import cp from 'child_process'
import util from 'util'
import * as R from 'ramda'
import LRU from 'lru-cache'
import { MediaFile, MediaFolder } from './models'

const DEFAULT_MEDIA_ROOT = '/mnt/x/'
const DEFAULT_MEDIA_ROOT2 = '/mnt/hdd1/'
const DEFAULT_STREAMING_ROOT = '' // 'http://192.168.0.10:8003/'
const DEFAULT_FLAG_FOLDER = '/mnt/x/flagged/'
const DEFAULT_FLAG_FOLDER2 = '/mnt/x/w/'
const DEFAULT_MOVE_FOLDER = '/mnt/x/x/'
const DEFAULT_MOVE_FOLDER2 = '/mnt/x/w/'
const DEFAULT_MOVE_FOLDER3 = '/mnt/x/zsync/'
const DEFAULT_MOVE_ALL_FOLDER = '/mnt/x/z/'

export const ACTION_FLAG = 'FLAG'
export const ACTION_MOVE = 'MOVE'
export const ACTION_MOVE_ALL = 'MOVE_ALL'
export const ACTION_DELETE = 'DELETE'
export const ACTION_SYNC = 'SYNC'

interface IVideoInfo {
  duration: number,
  width: number,
  height: number,
}

const CACHE_MAX = 1000
const videoInfoCache = new LRU<string, IVideoInfo>(CACHE_MAX)
const syncList = new LRU<string, String>(CACHE_MAX)

const fsp = fs.promises

export const sleep = async (ms: number): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  })
}

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

export const getMediaFolder = async (folderName: string): Promise<string> => {
  const folder = process.env.MEDIA_ROOT
  const folder2 = process.env.MEDIA_ROOT2
  const path = R.defaultTo(DEFAULT_MEDIA_ROOT, folder) + folderName
  const pathExists = await exists(path)
  return pathExists ? path : (R.defaultTo(DEFAULT_MEDIA_ROOT2, folder2) + folderName)
}

export const getStreamingRoot = (): string => {
  const folder = process.env.STREAMING_ROOT
  return R.defaultTo(DEFAULT_STREAMING_ROOT, folder)
}

export const getFlagFolder = (folderName: string): string => {
  const folder = process.env.FLAG_FOLDER
  const folder2 = process.env.FLAG_FOLDER2
  return folderName.startsWith('y') ? R.defaultTo(DEFAULT_FLAG_FOLDER2, folder2) : R.defaultTo(DEFAULT_FLAG_FOLDER, folder)
}

export const getMoveFolder = (folderName: string): string => {
  const folder = process.env.MOVE_FOLDER
  const folder2 = process.env.MOVE_FOLDER2
  const folder3 = process.env.MOVE_FOLDER3
  if (folderName.startsWith('zstream')) {
    return R.defaultTo(DEFAULT_MOVE_FOLDER3, folder3)
  }
  if (folderName.startsWith('x')) {
    return R.defaultTo(DEFAULT_MOVE_FOLDER2, folder2)
  }
  return R.defaultTo(DEFAULT_MOVE_FOLDER, folder)
}

export const getMoveAllFolder = (): string => {
  const folder = process.env.MOVE_ALL_FOLDER
  return R.defaultTo(DEFAULT_MOVE_ALL_FOLDER, folder)
}

const buildMediaFolder = (name: string): MediaFolder => {
  return {
    url: getStreamingRoot() + encodeURIComponent(name),
    name,
  }
}

export const mediaFolders: MediaFolder[] = [
  buildMediaFolder('ustream'),
  buildMediaFolder('wstream'),
  buildMediaFolder('xstream'),
  buildMediaFolder('ystream'),
  buildMediaFolder('zstream'),
  // buildMediaFolder('Movies'),
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

const parseVideoInfo = (path: string, lines: string[]): any => {
  let duration = 0
  let width = 0
  let height = 0
  R.forEach((line: string) => {
    line = line.trim()
    if (line.includes('.duration=') && !line.endsWith('"N/A"')) {
      // streams.stream.0.duration="7092.492375"
      duration = Math.floor(parseFloat(line.substring(27, line.length - 1)))
    }
    if (line.includes('.width=') && !line.endsWith('"N/A"')) {
      // streams.stream.0.width=416
      width = parseInt(line.substring(23, line.length))
    }
    if (line.includes('.height=') && !line.endsWith('"N/A"')) {
      // streams.stream.0.height=720
      height = parseInt(line.substring(24, line.length))
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
  // console.log(`parseVideoInfo() -> ${width} x ${height} ${duration}s ${path}`)
  return {
    duration,
    width,
    height,
  }
}

const getVideoInfo = async (path: string, stat: fs.Stats): Promise<IVideoInfo> => {
  const cacheKey = `${path} | ${stat.size} | ${stat.mtime}`
  let videoInfo = videoInfoCache.get(cacheKey)
  if (videoInfo) {
    return videoInfo
  }
  try {
    // const { stdout } = await execFile('D:/GoogleDrive/Workspace/AutoRecode/exe/ffprobe.exe', [
    const { stdout } = await execFile('ffprobe', [
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
      videoInfo = parseVideoInfo(path, lines)
    }
  }
  catch (ex) {
    console.error('getDuration() ex, path = ' + path)
  }
  if (videoInfo) {
    videoInfoCache.set(cacheKey, videoInfo)
  }
  else {
    videoInfo = {
      duration: 0,
      width: 0,
      height: 0,
    }
  }
  return videoInfo
}

export const getMediaFile = async (folderName: string, fileName: string): Promise<MediaFile | undefined> => {
  if (fileName.endsWith('.mp4') || fileName.endsWith('.mkv') || fileName.endsWith('.m4')) {
    const path = await getMediaFolder(folderName) + '/' + fileName
    try {
      const stat = await fsp.stat(path)
      const videoInfo = await getVideoInfo(path, stat)
      // console.log(`getMediaFile() ${fileName} duration =`, duration)
      return {
        url: getStreamingRoot() + encodeURIComponent(folderName)  + '/' + encodeURIComponent(fileName),
        fileSize: stat.size,
        lastModified: stat.mtime.getTime(),
        ...videoInfo,
      }
    }
    catch (ex) {
      // console.error(`getMediaFile() ${folderName} ${fileName}`, ex)
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

const getRealPath = async (folderName: string, fileName: string) => {
  let path = await getMediaFolder("zlater") + '/' + fileName
  let pathExists = await exists(path)
  if (pathExists) {
    return path
  }
  path = await getMediaFolder("zstream") + '/' + fileName
  pathExists = await exists(path)
  if (pathExists) {
    return path
  }
  return await getMediaFolder(folderName) + '/' + fileName
}

export const flagFiles = async (list: string[]) => {
  for (const url of list) {
    const [folderName, fileName] = parseMediaFileName(url)
    if (folderName && fileName) {
      const folder = R.find(R.propEq('name', folderName), mediaFolders)
      if (folder) {
        try {
          const path = await getRealPath(folderName, fileName)
          const target = getFlagFolder(folderName) + fileName
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
          const path = await getRealPath(folderName, fileName)
          const target = getMoveFolder(folderName) + fileName
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
          const path = await getMediaFolder(folderName) + '/' + fileName
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
  // move files from ystream to z
  const folderName = 'ystream'
  const folder = R.find(R.propEq('name', folderName), mediaFolders)
  if (folder) {
    try {
      const folderPath = await getMediaFolder(folderName)
      const list = await fsp.readdir(folderPath)
      for (const fileName of list) {
        if (fileName.endsWith('.mp4') || fileName.endsWith('.m4')) {
          const path = await getRealPath(folderName, fileName)
          const target = getMoveAllFolder() + fileName
          const oldExists = await exists(path)
          const newExists = await exists(target)
          if (oldExists && !newExists) {
            await fsp.rename(path, target)
          }
        }
      }
    }
    catch (ex) {
      console.error(`moveAllFiles() ex`, ex)
    }
  }
}

const getFileItemKey = (url: string) => {
  return url
}


export const syncFiles = async (list: string[]) => {
  R.forEach(json => {
    const fileItem: any = JSON.parse(json)
    const key = getFileItemKey(fileItem.url)
    console.log(`syncFiles -> key`, key)
    const existingItem: any = syncList.get(key)
    if (!existingItem || existingItem.lastUpdated < fileItem.lastUpdated) {
      syncList.set(key, fileItem)
    }
  }, list)
  return JSON.stringify(syncList.values())
}
