import express, { Request, Response } from 'express'

const app = express()

app.get('/api/hello', (req: Request, res: Response) => res.send('Hello, KatoExpress! ' + new Date()))

export default app
