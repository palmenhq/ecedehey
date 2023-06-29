import './main.css'
import './create.css'

import { assertBrowserCompatibility } from './browser-compat'
import {
  convertToJwk,
  exportPrivateKeyPlaintText,
  generateP256,
  getKeyFingerprint,
} from './keys'
import keyTemplate from './templates/key-template.html?raw'
import { downloadAsFile } from './utils'

try {
  const createButton = document.querySelector<HTMLButtonElement>('#create')!
  const infoArea = document.querySelector<HTMLDivElement>('#info')!

  assertBrowserCompatibility(infoArea, createButton)

  createButton!.addEventListener('click', async () => {
    const kp = await generateP256()
    const privateKeyJwk = await convertToJwk(kp.privateKey)
    const plainTextPrivateKey = exportPrivateKeyPlaintText(privateKeyJwk)

    const textEncoder = new TextEncoder()
    const html = keyTemplate.replace('%PRIVATE_KEY%', plainTextPrivateKey).replace('%VERSION%', (window as any).__ECEDEHEY_VERSION__)
    downloadAsFile(
      textEncoder.encode(html),
      `esedehey-PRIVATE_KEY-${await getKeyFingerprint(kp.privateKey)}.html`,
      'text/plain'
    )
  })
} catch (e) {
  console.error(e)
  alert('Error initializing file')
}
