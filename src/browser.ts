import { Request, Response } from 'express'
import { existsSync } from 'fs'
import * as R from 'ramda'
import * as Data from './data'

export const prepareBrowser = () => {
  R.forEach(mediaFolder => {
    const folderName = mediaFolder.name
    const folderPath = Data.getMediaRoot() + folderName
    Data.getMediaFiles(folderPath, folderName)
  }, Data.mediaFolders)
}

export const browse = async (req: Request, res: Response) => {
  res.send(Data.mediaFolders)
}

export const browseMediaFolder = async (req: Request, res: Response) => {
  const { name: folderName } = req.params
  const folder = R.find(R.propEq('name', folderName), Data.mediaFolders)
  let result: any = []
  const folderPath = Data.getMediaRoot() + folderName
  if (folder && existsSync(folderPath)) {
    result = Data.getMediaFiles(folderPath, folderName)
  }
  res.send(result)
}

export const execute = async (req: Request, res: Response) => {
  let result = {
    success: false,
    message: '',
  }
  if (req.body) {
    const { action, list } = req.body
    switch (action) {
      case Data.ACTION_FLAG:
        Data.flagFiles(R.defaultTo([], list))
        break

      case Data.ACTION_MOVE:
        Data.moveFiles(R.defaultTo([], list))
        break

      case Data.ACTION_DELETE:
        Data.deleteFiles(R.defaultTo([], list))
        break

      case Data.ACTION_MOVE_ALL:
        Data.moveAllFiles()
        break
    }
    result = {
      success: true,
      message: `${action} ${R.defaultTo('', list)}`,
    }
  }
  res.send(result)
}
