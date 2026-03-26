export const DEFAULT_ADMIN_MANAGEMENT_PASSWORD = '123456'

const HASH_VERSION = 'v1'
const PBKDF2_ITERATIONS = 120000
const HASH_BYTES = 32
const SALT_BYTES = 16

function bytesToBase64(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes))
}

function base64ToBytes(value: string) {
  return Uint8Array.from(atob(value), (char) => char.charCodeAt(0))
}

function timingSafeEqual(left: Uint8Array, right: Uint8Array) {
  if (left.length !== right.length) {
    return false
  }

  let diff = 0

  for (let index = 0; index < left.length; index += 1) {
    diff |= left[index] ^ right[index]
  }

  return diff === 0
}

async function deriveHash(password: string, salt: Uint8Array) {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )

  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    HASH_BYTES * 8,
  )

  return new Uint8Array(bits)
}

export async function hashAdminManagementPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES))
  const hash = await deriveHash(password, salt)

  return [HASH_VERSION, bytesToBase64(salt), bytesToBase64(hash)].join(':')
}

export async function verifyAdminManagementPassword(
  password: string,
  storedHash: string | null,
) {
  if (!storedHash) {
    return password === DEFAULT_ADMIN_MANAGEMENT_PASSWORD
  }

  const [version, saltBase64, hashBase64] = storedHash.split(':')

  if (version !== HASH_VERSION || !saltBase64 || !hashBase64) {
    return false
  }

  const salt = base64ToBytes(saltBase64)
  const expectedHash = base64ToBytes(hashBase64)
  const actualHash = await deriveHash(password, salt)

  return timingSafeEqual(actualHash, expectedHash)
}