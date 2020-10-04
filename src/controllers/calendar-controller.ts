import { addWeeks, format, startOfToday } from 'date-fns'
import { Request, Response } from 'express'
import { google } from 'googleapis'
import * as R from 'ramda'

const { OAuth2 } = google.auth

const CLIENT_ID = '872194152518-m9dmuf0i9heef3au1ld811shsn9bp0k8.apps.googleusercontent.com'
const CLIENT_SECRET = '5mc_f_24had5LNIxT1m-CrZz'
const REFRESH_TOKEN = '1//04jXCPLyX8sDLCgYIARAAGAQSNwF-L9Ir2rAfY_yjqBFNPN4LH4Pa3flJVI2s3MhfaxawIPUiwUPXKGSKlASMhvR8HVadLmzRrFA'

const oAuth2Client = new OAuth2(CLIENT_ID, CLIENT_SECRET)
oAuth2Client.setCredentials({
  refresh_token: REFRESH_TOKEN,
})

const calendar = google.calendar({ version: 'v3', auth: oAuth2Client })

export const getEvents = async (req: Request, res: Response) => {
  const eventStartTime = format(startOfToday(), 'yyyy-MM-dd') + 'T00:00:00.000Z'
  const eventEndTime = format(addWeeks(startOfToday(), 2), 'yyyy-MM-dd') + 'T00:00:00.000Z'
  const result = await calendar.events.list({
    calendarId: 'primary',
    singleEvents: true,
    timeMin: eventStartTime,
    timeMax: eventEndTime,
    orderBy: 'startTime',
  })
  const events = R.map((item: any) => ({
    id: item.id,
    summary: item.summary,
    start: item.start.date || item.start.dateTime,
    end: item.end.date || item.end.dateTime,
  }), R.defaultTo([], result.data.items))
  res.send(events)
}
