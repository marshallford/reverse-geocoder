import { Router } from 'express'

const health = () => {
  let r = Router()
  r.get('/', async (req, res) => {
    res.status(204).json()
  })
  return r
}

export default health
