import { Request, Response } from 'express'
import fs from 'fs'
import * as R from 'ramda'
import * as Data from './data'

const SLEEP_TIME = 10000 // sleep 10 seconds before refreshing the list

export const prepareBrowser = async () => {
  let watchCount = 0
  for (const mediaFolder of Data.mediaFolders) {
    const folderName = mediaFolder.name
    const folderPath = Data.getMediaRoot() + folderName
    await Data.getMediaFiles(folderPath, folderName)

    if (process.env.NODE_ENV !== 'test') {
      fs.watch(folderPath, {}, async (eventType, fileName) => {
        watchCount++
        await Data.sleep(SLEEP_TIME)
        if (--watchCount === 0)  {
          await Data.getMediaFiles(folderPath, folderName)
        }
      })
    }
  }
}

export const browse = async (req: Request, res: Response) => {
  res.send(Data.mediaFolders)
}

export const browseMediaFolder = async (req: Request, res: Response) => {
  const { name: folderName } = req.params
  const folder = R.find(R.propEq('name', folderName), Data.mediaFolders)
  let result: any = []
  const folderPath = Data.getMediaRoot() + folderName
  const folderExists = await Data.exists(folderPath)
  if (folder && folderExists) {
    result = await Data.getMediaFiles(folderPath, folderName)
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
        await Data.flagFiles(R.defaultTo([], list))
        break

      case Data.ACTION_MOVE:
        await Data.moveFiles(R.defaultTo([], list))
        break

      case Data.ACTION_DELETE:
        await Data.deleteFiles(R.defaultTo([], list))
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
