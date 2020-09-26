import dotenv from 'dotenv'
import compression from 'compression'
import helmet from 'helmet'
import app from './app'

dotenv.config()

const port = process.env.PORT

app.use(helmet()) // set well-known security-related HTTP headers
app.use(compression())

app.disable('x-powered-by')

const server = app.listen(port, () => console.log(`Starting ExpressJS server on Port ${port}`))

export default server
