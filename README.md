# Ecedehey

Self-contained little HTML files that can perform key exchange and encryption, using WebCrypto

**Warning!** Please note that this is built for educational purposes and has not been reviewed by any security expert. Do **not** rely on it for sensitive files.

Demo: [palmenhq.dev/create-ecehedey.html](https://www.palmenhq.dev/create-ecehedey.html)

## How it works

The concept is simple; An HTML file generates private keys, that are embedded into other HTML files (let's call them private key HTML files). These private key HTML files can encrypt and decrypt content performing an asynchronous ECDH. The idea struck me when I found out that filesystem-served (`file://`) files are considered a [secure context](https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts). The WebCrypto API is only available in secure contexts.

These are the steps that are taken in Ecedehey to encrypt and then decrypt something:

1. Alice and Bob generate a new Secret (private) Key HTML File (SKHF) each, which both contain a private/Secret Key (SK)
2. With the help of his SKHF, Bob sends his Public Key (PK) to Alice in the form of a Json Web Key (JWK)
3. Alice opens Bob's PK in her SKHF, which uses it to perform an Elliptic Curve Diffie-Hellman (ECDH) key derivation, giving her the Symmetric Encryption Key (SEK)
4. Still using the SKHF, she uses the SEK to symmetrically encrypt file F (using AES-256-GCM), and gets the result in the shape of a Json Web Encryption (JWE), and her own PK, which are serialized into a "ecdhmsg" file (which is just a cool name for transporting the JSON message)
5. Alice sends the ecdhmsg file to Bob (safely via an insecure medium)
6. Bob opens the ecdhmsg file using his SKHF. As the ecdhmsg contains Alic's PK, Bob's SKHF can derive the same SEK, and thus decrypt the file F 🥳 

## Read more

You can read more about it in my [blog post](https://www.palmenhq.dev/annotated/2023/06/fun-with-webcrypto/).
