import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, 'data')
const USERS_FILE = path.join(DATA_DIR, 'users.json')
const HISTORY_FILE = path.join(DATA_DIR, 'history.json')

// Ensure data directory and files exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}
if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, JSON.stringify([]))
}
if (!fs.existsSync(HISTORY_FILE)) {
  fs.writeFileSync(HISTORY_FILE, JSON.stringify([]))
}

function getRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', chunk => { body += chunk })
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {})
      } catch (e) {
        reject(e)
      }
    })
    req.on('error', (err) => reject(err))
  })
}

const apiMiddleware = {
  name: 'api-middleware',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      if (!req.url.startsWith('/api')) {
        return next()
      }

      res.setHeader('Content-Type', 'application/json')

      try {
        const url = new URL(req.url, `http://${req.headers.host}`)
        
        // ─── AUTHENTICATION REGISTER ───
        if (req.method === 'POST' && url.pathname === '/api/auth/register') {
          const { username, password } = await getRequestBody(req)
          if (!username || !password) {
            res.statusCode = 400
            res.end(JSON.stringify({ error: 'Username and password are required' }))
            return
          }

          const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'))
          if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
            res.statusCode = 400
            res.end(JSON.stringify({ error: 'User already exists' }))
            return
          }

          users.push({ username, password })
          fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2))
          
          res.statusCode = 201
          res.end(JSON.stringify({ success: true, username }))
          return
        }

        // ─── AUTHENTICATION LOGIN ───
        if (req.method === 'POST' && url.pathname === '/api/auth/login') {
          const { username, password } = await getRequestBody(req)
          const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'))
          const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password)

          if (!user) {
            res.statusCode = 401
            res.end(JSON.stringify({ error: 'Invalid username or password' }))
            return
          }

          res.statusCode = 200
          res.end(JSON.stringify({ success: true, username, token: `mock-jwt-${username}` }))
          return
        }

        // ─── SIMULATION HISTORY SAVE ───
        if (req.method === 'POST' && url.pathname === '/api/simulation/save') {
          const { username, action, details } = await getRequestBody(req)
          if (!username) {
            res.statusCode = 401
            res.end(JSON.stringify({ error: 'Unauthorized' }))
            return
          }

          const history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'))
          history.push({
            id: Date.now(),
            username,
            timestamp: new Date().toISOString(),
            action,
            details
          })
          fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2))

          res.statusCode = 200
          res.end(JSON.stringify({ success: true }))
          return
        }

        // ─── SIMULATION HISTORY FETCH ───
        if (req.method === 'GET' && url.pathname === '/api/simulation/history') {
          const username = url.searchParams.get('username')
          if (!username) {
            res.statusCode = 400
            res.end(JSON.stringify({ error: 'Username is required' }))
            return
          }

          const history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'))
          const userHistory = history.filter(h => h.username.toLowerCase() === username.toLowerCase())

          res.statusCode = 200
          res.end(JSON.stringify({ success: true, history: userHistory }))
          return
        }

        // ─── OLLAMA LOCAL AI PROXY ───
        if (req.method === 'POST' && url.pathname === '/api/ai/proxy') {
          const body = await getRequestBody(req)
          try {
            const ollamaResponse = await fetch('http://localhost:11434/api/generate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                model: body.model || 'gemma:2b',
                prompt: body.prompt,
                system: body.system,
                stream: false
              })
            })
            const data = await ollamaResponse.json()
            res.statusCode = 200
            res.end(JSON.stringify(data))
          } catch (err) {
            res.statusCode = 502
            res.end(JSON.stringify({ error: 'Ollama is offline or model not found. Check if Ollama runs locally on port 11434.' }))
          }
          return
        }

        res.statusCode = 404
        res.end(JSON.stringify({ error: 'Endpoint not found' }))
      } catch (err) {
        res.statusCode = 500
        res.end(JSON.stringify({ error: 'Internal Server Error', details: err.message }))
      }
    })
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), apiMiddleware],
})

