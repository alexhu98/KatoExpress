import { Request, Response } from 'express'
import { google } from 'googleapis'
import * as R from 'ramda'
import { addWeeks, formatISO, startOfToday } from 'date-fns'

const { OAuth2 } = google.auth

const CLIENT_ID = '872194152518-3uo269q5lraicu050a8rkc38h870mdac.apps.googleusercontent.com'
const CLIENT_SECRET = 'l_kFCBOCg-HhInFg-fhxmTOk'
const REFRESH_TOKEN = '1//04ec7EkXtkTtTCgYIARAAGAQSNwF-L9IrMpCliw1p5N65PH9GXts4mg5h-tT6kNBjmc9lqhtF-10p1NrCVp5yWqo1aRyy4ooqU3E'

const oAuth2Client = new OAuth2(CLIENT_ID, CLIENT_SECRET)
oAuth2Client.setCredentials({
  refresh_token: REFRESH_TOKEN,
})

const calendar = google.calendar({ version: 'v3', auth: oAuth2Client })

export const getEvents = async (req: Request, res: Response) => {
  const eventStartTime = formatISO(startOfToday())
  const eventEndTime = formatISO(addWeeks(startOfToday(), 2))
  try {
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
  catch (ex) {
    console.error(`CalendarController -> getEvents -> ex`, ex)
    res.send([])
  }
}
