import express, { Request, Response } from 'express'
import dotenv from 'dotenv'
import compression from 'compression'
import helmet from 'helmet'
import * as Browser from './browser'

dotenv.config()

const port = process.env.PORT
const app = express()

app.use(helmet()) // set well-known security-related HTTP headers
app.use(compression())
app.use(express.json())

app.disable('x-powered-by')

app.get('/api/media', Browser.browse)
app.get('/api/media/:name', Browser.browseMediaFolder)
app.post('/api/media', Browser.execute)

const server = app.listen(port, () => console.log(`Starting ExpressJS server on Port ${port}`))

if (process.env.NODE_ENV === 'test') {
    app.get('/api/terminate', (req: Request, res: Response) => {
    res.send('Terminate...');
    server.close()
  })
}

export default server
