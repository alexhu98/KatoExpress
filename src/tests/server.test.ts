import request from 'supertest'
import server from '../server'

describe('Sample Test', () => {
  it('should test that true === true', () => {
    expect(true).toBe(true)
  })
})

describe('request Hello', () => {
  it('Hello API Request', async () => {
    const result = await request(server).get('/')
    expect(result.status).toEqual(200)
    expect(result.text).toContain('Hello')
  })
})
