import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.PROD ? '/api' : '/api'
})

export default api
