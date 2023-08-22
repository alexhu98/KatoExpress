import { Request, Response } from 'express'
import fs from 'fs'
import Magnet2torrent from 'magnet2torrent-js'

const MAGNET_TIMEOUT = 60

export const execute = async (req: Request, res: Response) => {
  try {
    const { magnet } = req.params
    // const magnet = 'magnet:?xt=urn:btih:90289fd34dfc1cf8f316a268add8354c85334458'
    console.log(`MagnetHandler -> execute -> magnet =`, magnet)
    const m2t = new Magnet2torrent({ timeout: MAGNET_TIMEOUT })
    const torrent: any = await m2t.getTorrent(magnet)
    const name = torrent.name.replace("[XC]", "").replace("[XvX]", "")
    // const result = JSON.stringify(torrent)
    fs.writeFileSync(`/mnt/data/Downloads/x_${name}.torrent`, torrent.toTorrentFile())
    res.send(torrent.name)
  }
  catch (ex) {
    console.error(`MagnetHandler -> execute -> ex`, ex)
    res.send("")
  }
}
