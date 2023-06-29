export const assertBrowserCompatibility = (
  info: HTMLDivElement,
  create: HTMLButtonElement
) => {
  if (!('crypto' in window) || !('subtle' in crypto)) {
    info.classList.add('error')
    info.innerText =
      'This browser does not support Esedehay (missing subtle webcrypto)'
    create.remove()
  }
}
