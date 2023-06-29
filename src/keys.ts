import { Buffer } from 'buffer'
import {
  base64ToBase64Url,
  base64ToUint8Array,
  base64UrlToBase64,
  getHexFingerprint,
} from './utils'

export const generateP256 = async (): Promise<CryptoKeyPair> => {
  const kp = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveKey']
  )
  return kp
}

export const convertToJwk = async (key: CryptoKey): Promise<JsonWebKey> => {
  return crypto.subtle.exportKey('jwk', key)
}

export const filterPublicKeyJwkProperties = ({
  alg,
  kty,
  ext,
  crv,
  x,
  y,
  key_ops,
}: JsonWebKey): JsonWebKey => ({
  alg,
  kty,
  ext,
  crv,
  x,
  y,
  key_ops,
})

export const convertToCryptoKey = (
  jwk: JsonWebKey,
  usages: KeyUsage[] = ['deriveKey']
): Promise<CryptoKey> => {
  return crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    usages
  )
}

export const getKeyFingerprint = async (key: CryptoKey): Promise<string> => {
  const jwk = await convertToJwk(key)
  const x = base64ToUint8Array(base64UrlToBase64(jwk.x!))
  const y = base64ToUint8Array(base64UrlToBase64(jwk.y!))

  const rawUncompressedPublickey = new Uint8Array(65)
  rawUncompressedPublickey.set(new Uint8Array([0x04]), 0)
  rawUncompressedPublickey.set(x, 1)
  rawUncompressedPublickey.set(y, 32)
  const rawFingerprint = await crypto.subtle.digest(
    'SHA-256',
    rawUncompressedPublickey
  )
  const fingerPrint = getHexFingerprint(rawFingerprint)

  return `0k` + fingerPrint
}

export const exportPublicKeyPlainText = (key: JsonWebKey): string => {
  const serializableKey = {
    kty: key.kty,
    crv: key.crv,
    x: key.x,
    y: key.y,
    ext: true,
    key_opts: key.key_ops,
  }

  return base64ToBase64Url(
    new Buffer(JSON.stringify(serializableKey)).toString('base64')
  )
}
export const exportPrivateKeyPlaintText = (key: JsonWebKey): string => {
  return base64ToBase64Url(new Buffer(JSON.stringify(key)).toString('base64'))
}

export const jsonParseBase64Url = (b46u: string) =>
  JSON.parse(new Buffer(base64UrlToBase64(b46u), 'base64').toString('utf8'))
