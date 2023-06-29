import { Buffer } from 'buffer'
import { base64UrlToBase64, getHexFingerprint, toBase64Url } from './utils'
import { convertToJwk, exportPublicKeyPlainText } from './keys'

const deriveKey = (privateKey: CryptoKey, otherPublicKey: CryptoKey) =>
  crypto.subtle.deriveKey(
    { name: 'ECDH', public: otherPublicKey },
    privateKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )

const a256gcmAuthTagLength = 128

export const encrypt = async (
  privateKey: CryptoKey,
  otherPublicKey: CryptoKey,
  plainTextMessage: Uint8Array
) => {
  const encryptionKey = await deriveKey(privateKey, otherPublicKey)

  const iv = new Uint8Array(12)
  crypto.getRandomValues(iv)

  const data = await crypto.subtle.encrypt(
    { name: 'AES-GCM', length: 256, iv, tagLength: a256gcmAuthTagLength },
    encryptionKey,
    plainTextMessage
  )
  const cipherText = data.slice(0, data.byteLength - a256gcmAuthTagLength / 8)
  const authTag = data.slice(data.byteLength - a256gcmAuthTagLength / 8)
  return {
    iv,
    cipherText,
    authTag,
  }
}

export const decrypt = async (
  privateKey: CryptoKey,
  otherPublicKey: CryptoKey,
  iv: ArrayBuffer,
  encryptedMessage: ArrayBuffer,
  authTag: ArrayBuffer
) => {
  const decryptionKey = await deriveKey(privateKey, otherPublicKey)
  const fullMessage = new Uint8Array(
    encryptedMessage.byteLength + authTag.byteLength
  )
  fullMessage.set(new Uint8Array(encryptedMessage), 0)
  fullMessage.set(new Uint8Array(authTag), encryptedMessage.byteLength)
  return crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      length: 256,
      iv,
      tagLength: a256gcmAuthTagLength,
    },
    decryptionKey,
    fullMessage
  )
}

export const parseJwe = (message: string) => {
  const [headersRaw, _cek, ivRaw, cipherTextRaw, authTagRaw] = message
    .split('.')
    .map((part) => base64UrlToBase64(part))
    .map((part) => new Buffer(part, 'base64'))

  const headers = JSON.parse(headersRaw.toString('utf8'))
  const iv = ivRaw.buffer
  const cipherText = cipherTextRaw.buffer
  const authTag = authTagRaw.buffer

  return { headers, iv, cipherText, authTag }
}

export const getJweFingerprint = async (jwe: string) => {
  const te = new TextEncoder()
  const digest = await crypto.subtle.digest('SHA-256', te.encode(jwe))
  return `0m` + getHexFingerprint(digest)
}

export const serializeMessage = async ({
  originalFileName,
  jwe,
  privateKey,
}: {
  originalFileName: string
  originalFileType: string
  jwe: string
  privateKey: CryptoKey
}) =>
  toBase64Url(
    JSON.stringify({
      originalFileName,
      jwe,
      otherPublicKey: exportPublicKeyPlainText(await convertToJwk(privateKey)),
    })
  )

export const parseMessage = (
  message: string
): {
  jwe: string
  otherPublicKey: string
  originalFileName: string
  originalFileType: string
} => {
  return JSON.parse(
    new Buffer(base64UrlToBase64(message), 'base64').toString('utf8')
  )
}
