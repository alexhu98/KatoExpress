import express from 'express'
import dotenv from 'dotenv'
import compression from 'compression'
import helmet from 'helmet'
import cors from 'cors'
import * as Browser from './controllers/browser'
import * as Calendar from './controllers/calendar-controller'

dotenv.config()

const port = process.env.PORT
const app = express()

if (process.env.NODE_ENV !== 'test') {
  Browser.prepareBrowser().then(() => console.log('Browser cached'))
}

app.use(helmet()) // set well-known security-related HTTP headers
app.use(compression())
app.use(express.json())
app.use(cors())

app.disable('x-powered-by')

app.get('/api/media', Browser.browse)
app.get('/api/media/:name', Browser.browseMediaFolder)
app.post('/api/media', Browser.execute)

app.get('/api/calendar/events', Calendar.getEvents)

app.use('/ustream', express.static('/mnt/x/ustream'))
app.use('/wstream', express.static('/mnt/x/wstream'))
app.use('/xstream', express.static('/mnt/x/xstream'))
app.use('/ystream', express.static('/mnt/x/ystream'))
app.use('/zstream', express.static('/mnt/x/zstream'))
// app.use('/Movies', express.static('/home/alex/Videos/Movies'))

app.use('/', express.static('/mnt/data/GoogleDrive/PythonProjects'))


const server = app.listen(port, () => console.log(`Starting ExpressJS server on Port ${port}`))

export default server
