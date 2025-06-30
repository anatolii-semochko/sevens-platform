import api, { fetchErrorMessage } from './index'

const mainUrl = '/help'

export const fetchHelps = (params) => api
  .get(mainUrl, {params})
  .then(res => res.data)

export const fetchError = (error) => fetchErrorMessage(error)
