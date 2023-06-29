import './main.css'
import './key.css'

import { Buffer } from 'buffer'
import {
  convertToCryptoKey,
  convertToJwk,
  filterPublicKeyJwkProperties,
  getKeyFingerprint,
  jsonParseBase64Url,
} from './keys'
import {
  decrypt,
  encrypt,
  getJweFingerprint,
  parseJwe,
  parseMessage,
  serializeMessage,
} from './encryption'
import {
  base64ToBase64Url,
  downloadAsFile,
  readFile,
  toBase64Url,
} from './utils'

export const initializeKey = async (privateKey: CryptoKey) => {
  const publicKeyField = document.querySelector<HTMLPreElement>('#public-key')!
  const keyDownloadLink = document.querySelector<HTMLAnchorElement>(
    '#public-key-download'
  )!
  document.querySelector<HTMLSpanElement>('#app-version')!.innerText = ` (${
    (window as any).__ECEDEHEY_VERSION__
  })`

  const publicKeyJwk = filterPublicKeyJwkProperties(
    await convertToJwk(privateKey)
  )
  const publicKeyFingerprint = await getKeyFingerprint(privateKey)

  publicKeyField.innerText = base64ToBase64Url(
    new Buffer(JSON.stringify(publicKeyJwk)).toString('base64')
  )
  keyDownloadLink.href =
    'data:text/base64url;charset=utf-8,' +
    encodeURIComponent(JSON.stringify(publicKeyJwk))
  keyDownloadLink.download = `ecedehey-PUBLIC_KEY-${publicKeyFingerprint}.jwk`
  const publicKeyFingerprintField = document.querySelector<HTMLPreElement>(
    '#public-key-fingerprint'
  )!
  publicKeyFingerprintField.innerText = publicKeyFingerprint
  document.title = 'Ecedehey private key: ' + publicKeyFingerprint

  const otherPublicKeyInput = document.querySelector('#other-public-key-input')!
  otherPublicKeyInput.addEventListener('change', handlePublicKeyChange)

  document
    .querySelector<HTMLInputElement>('#other-public-key-input')!
    .addEventListener('change', (e) => {
      if ((e.target as HTMLInputElement).files!.length > 0) {
        document.querySelector<HTMLButtonElement>('#encrypt-button')!.disabled =
          false
      }
    })
  document
    .querySelector<HTMLButtonElement>('#encrypt-button')!
    .addEventListener('click', handleEncryptButtonClick(privateKey))
  document
    .querySelector<HTMLButtonElement>('#decrypt-file-input')!
    .addEventListener('change', handleDecryptButtonChange(privateKey))
}

const getOtherPublicKey = () =>
  document.querySelector<HTMLInputElement>('#other-public-key-input')?.dataset
    .rawPublicKey

const handleEncryptButtonClick = (privateKey: CryptoKey) => async () => {
  const otherPublicKey = getOtherPublicKey()
  const fileToEncrypt =
    document.querySelector<HTMLInputElement>('#file-to-encrypt')!.files![0]
  const plainText = await readFile(fileToEncrypt)

  if (!otherPublicKey) {
    console.error('Missing other public key')
    return
  }
  if (!plainText) {
    console.error('Missing plain text to encrypt')
    return
  }

  const { iv, cipherText, authTag } = await encrypt(
    privateKey,
    await convertToCryptoKey(JSON.parse(otherPublicKey), []),
    new Uint8Array(plainText)
  )

  const jweHeader = JSON.stringify({
    alg: 'ECDH',
    enc: 'A256-GCM',
  })
  const cek = ''

  const jwe = [
    toBase64Url(jweHeader),
    toBase64Url(cek),
    toBase64Url(iv),
    toBase64Url(cipherText),
    toBase64Url(authTag),
  ].join('.')

  const textEncoder = new TextEncoder()
  downloadAsFile(
    textEncoder.encode(
      await serializeMessage({
        originalFileName: fileToEncrypt.name,
        originalFileType: fileToEncrypt.type,
        jwe,
        privateKey,
      })
    ),
    `ecedehey-MESSAGE-${await getJweFingerprint(jwe)}.ecdhmsg`,
    'text/plain'
  )
}

const handleDecryptButtonChange =
  (privateKey: CryptoKey) => async (e: Event) => {
    const textDecoder = new TextDecoder()
    const messageAb = await readFile((e.target as HTMLInputElement).files![0])
    const message = textDecoder.decode(messageAb!)

    if (!message) {
      console.error('Missing message to decrypt')
      return
    }

    const { jwe, otherPublicKey, originalFileName, originalFileType } =
      parseMessage(message)

    const { iv, cipherText, authTag } = parseJwe(jwe)

    const decrypted = await decrypt(
      privateKey,
      await convertToCryptoKey(jsonParseBase64Url(otherPublicKey), []),
      iv,
      cipherText,
      authTag
    )

    await downloadAsFile(decrypted, originalFileName, originalFileType)
  }

const handlePublicKeyChange = async (e: Event) => {
  try {
    const inputElement = e.target as HTMLInputElement
    const rawPublicKeyAb = await readFile(inputElement.files![0])
    const textDecoder = new TextDecoder()
    const rawPublicKey = textDecoder.decode(rawPublicKeyAb!)

    if (!rawPublicKey) {
      throw new Error('Missing public key contents')
    }

    const otherPublicKeyFingerprintBox = document.querySelector<HTMLDivElement>(
      '#other-public-key-fingerprint'
    )!
    const key = await convertToCryptoKey(JSON.parse(rawPublicKey), [])
    otherPublicKeyFingerprintBox.classList.remove('display-none')
    otherPublicKeyFingerprintBox.querySelector<HTMLPreElement>(
      '.key-box__key'
    )!.innerText = await getKeyFingerprint(key)
    inputElement.dataset.rawPublicKey = rawPublicKey

    if (
      document.querySelector<HTMLInputElement>('#file-to-encrypt')!.files!
        .length > 0
    ) {
      document.querySelector<HTMLButtonElement>('#encrypt-button')!.disabled =
        false
    }
  } catch (e: any) {
    console.error('Failed to compute key fingerprint: ', e)
  }
}
