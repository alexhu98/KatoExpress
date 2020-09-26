import request from 'supertest'
import server from '../server'

afterAll(async () => await request(server).get('/api/terminate'))

describe('Self Test', () => {
  it('should test that true === true', () => {
    expect(true).toBe(true)
  })
})

describe('Request Hello API', () => {
  it('Hello API Request', async () => {
    const result = await request(server).get('/api/hello')
    expect(result.status).toEqual(200)
    expect(result.text).toContain('Hello')
  })
})
