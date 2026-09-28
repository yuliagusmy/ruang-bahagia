import api from './api'

const photographerService = {
  getByUsername: (username) => api.get(`/photographers/${username}`),
}

export default photographerService
