const ZIP_LOCAL_FILE_HEADER_SIGNATURE = 0x04034b50
const ZIP_CENTRAL_DIRECTORY_HEADER_SIGNATURE = 0x02014b50
const ZIP64_EXTRA_FIELD_ID = 0x0001
const ZIP_UINT32_MAX = 0xffffffff
const ZIP_LOCAL_FILE_HEADER_LENGTH = 30
const ZIP_CENTRAL_DIRECTORY_HEADER_LENGTH = 46

type Zip64ExtraFields = {
  uncompressedSize?: number
  compressedSize?: number
  localHeaderOffset?: number
}

function readUint64AsSafeNumber(
  view: DataView,
  offset: number,
): number | undefined {
  const value = view.getBigUint64(offset, true)
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) return undefined

  return Number(value)
}

function readZip64ExtraFields(
  view: DataView,
  extraStart: number,
  extraLength: number,
  needs: {
    uncompressedSize: boolean
    compressedSize: boolean
    localHeaderOffset: boolean
  },
): Zip64ExtraFields {
  const fields: Zip64ExtraFields = {}
  const extraEnd = extraStart + extraLength
  let cursor = extraStart

  while (cursor + 4 <= extraEnd) {
    const fieldId = view.getUint16(cursor, true)
    const fieldLength = view.getUint16(cursor + 2, true)
    const fieldStart = cursor + 4
    const fieldEnd = fieldStart + fieldLength

    if (fieldEnd > extraEnd) break

    if (fieldId === ZIP64_EXTRA_FIELD_ID) {
      let fieldCursor = fieldStart

      if (needs.uncompressedSize && fieldCursor + 8 <= fieldEnd) {
        fields.uncompressedSize = readUint64AsSafeNumber(view, fieldCursor)
        fieldCursor += 8
      }

      if (needs.compressedSize && fieldCursor + 8 <= fieldEnd) {
        fields.compressedSize = readUint64AsSafeNumber(view, fieldCursor)
        fieldCursor += 8
      }

      if (needs.localHeaderOffset && fieldCursor + 8 <= fieldEnd) {
        fields.localHeaderOffset = readUint64AsSafeNumber(view, fieldCursor)
      }

      return fields
    }

    cursor = fieldEnd
  }

  return fields
}

function patchUint32IfZip64(
  view: DataView,
  offset: number,
  value: number | undefined,
): boolean {
  if (view.getUint32(offset, true) !== ZIP_UINT32_MAX) return false
  if (value === undefined || value > ZIP_UINT32_MAX) return false

  view.setUint32(offset, value, true)
  return true
}

export function normalizeZip64ExcelBuffer(data: ArrayBuffer): ArrayBuffer {
  const bytes = new Uint8Array(data)
  const view = new DataView(data)
  let cursor = 0

  while (
    cursor + ZIP_LOCAL_FILE_HEADER_LENGTH <= bytes.length &&
    view.getUint32(cursor, true) === ZIP_LOCAL_FILE_HEADER_SIGNATURE
  ) {
    const compressedSize = view.getUint32(cursor + 18, true)
    const uncompressedSize = view.getUint32(cursor + 22, true)
    const fileNameLength = view.getUint16(cursor + 26, true)
    const extraLength = view.getUint16(cursor + 28, true)
    const extraStart = cursor + ZIP_LOCAL_FILE_HEADER_LENGTH + fileNameLength
    const zip64Fields = readZip64ExtraFields(view, extraStart, extraLength, {
      uncompressedSize: uncompressedSize === ZIP_UINT32_MAX,
      compressedSize: compressedSize === ZIP_UINT32_MAX,
      localHeaderOffset: false,
    })

    patchUint32IfZip64(view, cursor + 18, zip64Fields.compressedSize)
    patchUint32IfZip64(view, cursor + 22, zip64Fields.uncompressedSize)

    const resolvedCompressedSize =
      compressedSize === ZIP_UINT32_MAX
        ? zip64Fields.compressedSize
        : compressedSize

    if (
      resolvedCompressedSize === undefined ||
      resolvedCompressedSize > bytes.length
    ) {
      return data
    }

    cursor = extraStart + extraLength + resolvedCompressedSize
  }

  while (
    cursor + ZIP_CENTRAL_DIRECTORY_HEADER_LENGTH <= bytes.length &&
    view.getUint32(cursor, true) === ZIP_CENTRAL_DIRECTORY_HEADER_SIGNATURE
  ) {
    const compressedSize = view.getUint32(cursor + 20, true)
    const uncompressedSize = view.getUint32(cursor + 24, true)
    const localHeaderOffset = view.getUint32(cursor + 42, true)
    const fileNameLength = view.getUint16(cursor + 28, true)
    const extraLength = view.getUint16(cursor + 30, true)
    const commentLength = view.getUint16(cursor + 32, true)
    const extraStart =
      cursor + ZIP_CENTRAL_DIRECTORY_HEADER_LENGTH + fileNameLength
    const zip64Fields = readZip64ExtraFields(view, extraStart, extraLength, {
      uncompressedSize: uncompressedSize === ZIP_UINT32_MAX,
      compressedSize: compressedSize === ZIP_UINT32_MAX,
      localHeaderOffset: localHeaderOffset === ZIP_UINT32_MAX,
    })

    patchUint32IfZip64(view, cursor + 20, zip64Fields.compressedSize)
    patchUint32IfZip64(view, cursor + 24, zip64Fields.uncompressedSize)
    patchUint32IfZip64(view, cursor + 42, zip64Fields.localHeaderOffset)

    cursor = extraStart + extraLength + commentLength
  }

  return data
}
