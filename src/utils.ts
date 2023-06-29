import { Buffer } from 'buffer'

export const base64ToBase64Url = (base64Str: string) =>
  base64Str.replace(/\//g, '_').replace(/\+/g, '-').replace(/=/g, '')
export const base64UrlToBase64 = (base64urlStr: string) =>
  base64urlStr.replace(/-/g, '+').replace(/_/g, '/')

export const toBase64Url = (thing: ArrayBuffer | string) => {
  if (thing instanceof ArrayBuffer) {
    return base64ToBase64Url(Buffer.from(thing).toString('base64'))
  }

  return base64ToBase64Url(new Buffer(thing, 'utf8').toString('base64'))
}

export const base64ToUint8Array = (base64Str: string) => {
  return new Uint8Array(new Buffer(base64Str, 'base64').buffer)
}

export const getHexFingerprint = (rawFingerprint: ArrayBuffer) =>
  Array.from(new Uint8Array(rawFingerprint))
    .slice(16)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')

export const downloadAsFile = (
  content: ArrayBuffer,
  fileName: string,
  type: string
) => {
  const downloadLink = document.createElement('a')
  downloadLink.href = URL.createObjectURL(new Blob([content], { type }))
  downloadLink.download = fileName
  document.body.append(downloadLink)
  downloadLink.click()
  downloadLink.remove()
}

export const readFile = (file: Blob) =>
  new Promise<ArrayBuffer | null>((resolve, reject) => {
    const fr = new FileReader()
    fr.onloadend = (frEvent) => {
      const message = frEvent.target!.result
      resolve(message as ArrayBuffer | null)
    }
    fr.onerror = (err) => reject(err)
    fr.readAsArrayBuffer(file)
  })
