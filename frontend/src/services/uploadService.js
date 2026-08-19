import { apiRequest, getApiBaseUrl } from './apiClient.js'

export async function uploadAttachments(files = []) {
  if (!Array.isArray(files) || files.length === 0) {
    return []
  }

  const formData = new FormData()
  files.forEach((file) => {
    if (file) {
      formData.append('files', file)
    }
  })

  const uploaded = await apiRequest('/api/uploads', {
    method: 'POST',
    body: formData,
  })

  return Array.isArray(uploaded) ? uploaded : []
}

export function parseAttachmentReference(reference = '') {
  if (!reference || typeof reference !== 'string') {
    return { label: '', href: '' }
  }

  const separatorIndex = reference.indexOf('::')
  if (separatorIndex >= 0) {
    const label = reference.slice(0, separatorIndex)
    const rawPath = reference.slice(separatorIndex + 2)
    if (rawPath.startsWith('/uploads/')) {
      return { label, href: `${getApiBaseUrl()}${rawPath}` }
    }
    if (rawPath.startsWith('http://') || rawPath.startsWith('https://')) {
      return { label, href: rawPath }
    }
    return { label, href: '' }
  }

  if (reference.startsWith('/uploads/')) {
    const label = reference.split('/').pop() || reference
    return { label, href: `${getApiBaseUrl()}${reference}` }
  }

  if (reference.startsWith('http://') || reference.startsWith('https://')) {
    const label = reference.split('/').pop() || reference
    return { label, href: reference }
  }

  return { label: reference, href: '' }
}
