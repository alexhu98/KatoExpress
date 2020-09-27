import { Request, Response } from 'express'
import fs from 'fs'
import * as R from 'ramda'
import * as RA from 'ramda-adjunct'
import * as Data from './data'

export const browse = async (req: Request, res: Response) => {
  res.send(Data.mediaFolders)
}

export const browseMediaFolder = async (req: Request, res: Response) => {
  const { name: folderName } = req.params
  const folder = R.find(R.propEq('name', folderName), Data.mediaFolders)
  let result: any = []
  if (folder) {
    const folderPath = Data.getMediaRoot() + folderName
    if (fs.existsSync(folderPath)) {
      const list = fs.readdirSync(folderPath)
      // console.log(`browseMediaFolder -> list`, list)
      result = R.pipe(
        R.map((fileName: string) => Data.getMediaFile(folderName, fileName)),
        RA.compact,
      )(list)
      // console.log(`browseMediaFolder -> result`, result)
    }
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
