import request from 'supertest'
import server from '../server'
import * as Data from '../data'
import { MediaFile } from '../models'

afterAll(async () => await server.close())

describe('browse()', () => {
  it('/api/media', async () => {
    const result = await request(server).get('/api/media')
    expect(result.status).toEqual(200)
    const folders = result.body
    expect(folders.length).toEqual(6)
    expect(folders[0].url).not.toContain(' ')
    expect(folders[0].url).toContain('stream')
    expect(folders[0].name).toContain('stream')
  })
})

describe('browseMediaFolder()', () => {
  it('/api/media/wrong_name', async () => {
    const result = await request(server).get('/api/media/wrong_name')
    expect(result.status).toEqual(200)
    const files = result.body
    expect(files.length).toEqual(0)
  })

  it('/api/media/xstream', async () => {
    const result = await request(server).get('/api/media/xstream')
    expect(result.status).toEqual(200)
    const files = result.body
    expect(files.length).toBeGreaterThan(0)
    const file: MediaFile = files[0]
    expect(file.url).not.toContain(' ')
    expect(file.url).toContain('stream')
    expect(file.fileSize).toBeGreaterThan(0)
    expect(file.lastModified).toBeGreaterThan(0)
    expect(file.duration).toBeGreaterThan(0)
  })
})

describe('flagMediaFile()', () => {
  it('FLAG no list', async () => {
    const result = await request(server).post('/api/media').send({
      action: Data.ACTION_FLAG,
    })
    .set('Accept', 'application/json')
    .set('Content-Type', 'application/json')
    expect(result.status).toEqual(200)
    const { success, message } = result.body
    expect(success).toEqual(true)
    expect(message).toContain(Data.ACTION_FLAG)
  })

  it('FLAG empty list', async () => {
    const result = await request(server).post('/api/media').send({
      action: Data.ACTION_FLAG,
      list: [],
    })
    .set('Accept', 'application/json')
    .set('Content-Type', 'application/json')
    expect(result.status).toEqual(200)
    const { success, message } = result.body
    expect(success).toEqual(true)
    expect(message).toContain(Data.ACTION_FLAG)
  })

  it('FLAG bad list', async () => {
    const result = await request(server).post('/api/media').send({
      action: Data.ACTION_FLAG,
      list: ['wrong_name'],
    })
    .set('Accept', 'application/json')
    .set('Content-Type', 'application/json')
    expect(result.status).toEqual(200)
    const { success, message } = result.body
    expect(success).toEqual(true)
    expect(message).toContain(Data.ACTION_FLAG)
  })

  it('FLAG single in list', async () => {
    const browseResult = await request(server).get('/api/media/xstream')
    expect(browseResult.status).toEqual(200)
    const files = browseResult.body
    expect(files.length).toBeGreaterThan(0)
    const file: MediaFile = files[0]
    const { url } = file
    expect(file.url).toContain('stream')

    const result = await request(server).post('/api/media').send({
      action: Data.ACTION_FLAG,
      list: [url],
    })
    .set('Accept', 'application/json')
    .set('Content-Type', 'application/json')
    expect(result.status).toEqual(200)
    const { success, message } = result.body
    expect(success).toEqual(true)
    expect(message).toContain(Data.ACTION_FLAG)
  })

  it('FLAG duplicate in list', async () => {
    const browseResult = await request(server).get('/api/media/xstream')
    expect(browseResult.status).toEqual(200)
    const files = browseResult.body
    expect(files.length).toBeGreaterThan(0)
    const file: MediaFile = files[0]
    const { url } = file
    expect(file.url).toContain('stream')

    const result = await request(server).post('/api/media').send({
      action: Data.ACTION_FLAG,
      list: [url, url],
    })
    .set('Accept', 'application/json')
    .set('Content-Type', 'application/json')
    expect(result.status).toEqual(200)
    const { success, message } = result.body
    expect(success).toEqual(true)
    expect(message).toContain(Data.ACTION_FLAG)
  })
})

describe('moveMediaFile()', () => {
  it('MOVE no list', async () => {
    const result = await request(server).post('/api/media').send({
      action: Data.ACTION_MOVE,
    })
    .set('Accept', 'application/json')
    .set('Content-Type', 'application/json')
    expect(result.status).toEqual(200)
    const { success, message } = result.body
    expect(success).toEqual(true)
    expect(message).toContain(Data.ACTION_MOVE)
  })

  it('MOVE empty list', async () => {
    const result = await request(server).post('/api/media').send({
      action: Data.ACTION_MOVE,
      list: [],
    })
    .set('Accept', 'application/json')
    .set('Content-Type', 'application/json')
    expect(result.status).toEqual(200)
    const { success, message } = result.body
    expect(success).toEqual(true)
    expect(message).toContain(Data.ACTION_MOVE)
  })

  it('MOVE bad list', async () => {
    const result = await request(server).post('/api/media').send({
      action: Data.ACTION_MOVE,
      list: ['wrong_name'],
    })
    .set('Accept', 'application/json')
    .set('Content-Type', 'application/json')
    expect(result.status).toEqual(200)
    const { success, message } = result.body
    expect(success).toEqual(true)
    expect(message).toContain(Data.ACTION_MOVE)
  })

  it('MOVE single in list', async () => {
    const browseResult = await request(server).get('/api/media/xstream')
    expect(browseResult.status).toEqual(200)
    const files = browseResult.body
    expect(files.length).toBeGreaterThan(0)
    const file: MediaFile = files[0]
    const { url } = file
    expect(file.url).toContain('stream')

    const result = await request(server).post('/api/media').send({
      action: Data.ACTION_MOVE,
      list: [url],
    })
    .set('Accept', 'application/json')
    .set('Content-Type', 'application/json')
    expect(result.status).toEqual(200)
    const { success, message } = result.body
    expect(success).toEqual(true)
    expect(message).toContain(Data.ACTION_MOVE)
  })

  it('MOVE duplicate in list', async () => {
    const browseResult = await request(server).get('/api/media/xstream')
    expect(browseResult.status).toEqual(200)
    const files = browseResult.body
    expect(files.length).toBeGreaterThan(0)
    const file: MediaFile = files[0]
    const { url } = file
    expect(file.url).toContain('stream')

    const result = await request(server).post('/api/media').send({
      action: Data.ACTION_MOVE,
      list: [url, url],
    })
    .set('Accept', 'application/json')
    .set('Content-Type', 'application/json')
    expect(result.status).toEqual(200)
    const { success, message } = result.body
    expect(success).toEqual(true)
    expect(message).toContain(Data.ACTION_MOVE)
  })
})

describe('deleteMediaFile()', () => {
  it('DELETE no list', async () => {
    const result = await request(server).post('/api/media').send({
      action: Data.ACTION_DELETE,
    })
    .set('Accept', 'application/json')
    .set('Content-Type', 'application/json')
    expect(result.status).toEqual(200)
    const { success, message } = result.body
    expect(success).toEqual(true)
    expect(message).toContain(Data.ACTION_DELETE)
  })

  it('DELETE empty list', async () => {
    const result = await request(server).post('/api/media').send({
      action: Data.ACTION_DELETE,
      list: [],
    })
    .set('Accept', 'application/json')
    .set('Content-Type', 'application/json')
    expect(result.status).toEqual(200)
    const { success, message } = result.body
    expect(success).toEqual(true)
    expect(message).toContain(Data.ACTION_DELETE)
  })

  it('DELETE bad list', async () => {
    const result = await request(server).post('/api/media').send({
      action: Data.ACTION_DELETE,
      list: ['wrong_name'],
    })
    .set('Accept', 'application/json')
    .set('Content-Type', 'application/json')
    expect(result.status).toEqual(200)
    const { success, message } = result.body
    expect(success).toEqual(true)
    expect(message).toContain(Data.ACTION_DELETE)
  })

  it('DELETE single in list', async () => {
    const browseResult = await request(server).get('/api/media/xstream')
    expect(browseResult.status).toEqual(200)
    const files = browseResult.body
    expect(files.length).toBeGreaterThan(0)
    const file: MediaFile = files[0]
    const { url } = file
    expect(file.url).toContain('stream')

    const result = await request(server).post('/api/media').send({
      action: Data.ACTION_DELETE,
      list: [url],
    })
    .set('Accept', 'application/json')
    .set('Content-Type', 'application/json')
    expect(result.status).toEqual(200)
    const { success, message } = result.body
    expect(success).toEqual(true)
    expect(message).toContain(Data.ACTION_DELETE)
  })

  it('DELETE duplicate in list', async () => {
    const browseResult = await request(server).get('/api/media/xstream')
    expect(browseResult.status).toEqual(200)
    const files = browseResult.body
    expect(files.length).toBeGreaterThan(0)
    const file: MediaFile = files[0]
    const { url } = file
    expect(file.url).toContain('stream')

    const result = await request(server).post('/api/media').send({
      action: Data.ACTION_DELETE,
      list: [url, url],
    })
    .set('Accept', 'application/json')
    .set('Content-Type', 'application/json')
    expect(result.status).toEqual(200)
    const { success, message } = result.body
    expect(success).toEqual(true)
    expect(message).toContain(Data.ACTION_DELETE)
  })
})

describe('moveAllMediaFiles()', () => {
  it('MOVE_ALL', async () => {
    const result = await request(server).post('/api/media').send({
      action: Data.ACTION_MOVE_ALL,
    })
    .set('Accept', 'application/json')
    .set('Content-Type', 'application/json')
    expect(result.status).toEqual(200)
    const { success, message } = result.body
    expect(success).toEqual(true)
    expect(message).toContain(Data.ACTION_MOVE_ALL)
  })
})
