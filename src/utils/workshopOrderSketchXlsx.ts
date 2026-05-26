import JSZip from 'jszip'

const CONTENT_TYPES_NS =
  'http://schemas.openxmlformats.org/package/2006/content-types'
const RELATIONSHIPS_NS =
  'http://schemas.openxmlformats.org/package/2006/relationships'
const OFFICE_RELATIONSHIPS_NS =
  'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
const SPREADSHEET_DRAWING_NS =
  'http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing'
const DRAWING_MAIN_NS = 'http://schemas.openxmlformats.org/drawingml/2006/main'

const DRAWING_RELATIONSHIP_TYPE = `${OFFICE_RELATIONSHIPS_NS}/drawing`
const IMAGE_RELATIONSHIP_TYPE = `${OFFICE_RELATIONSHIPS_NS}/image`
const DRAWING_CONTENT_TYPE =
  'application/vnd.openxmlformats-officedocument.drawing+xml'

export interface WorkshopOrderSketchFile {
  fileName: string
  extension: string
  mimeType: string
  data: ArrayBuffer
}

export interface WorksheetSketchFile extends WorkshopOrderSketchFile {
  rowNumber: number
}

export interface WorksheetSketchPlacement {
  rowNumber: number
  columnNumber?: number
  fileName: string
  extension: string
  mimeType: string
  data: ArrayBuffer
}

function parseXml(xml: string): Document {
  return new DOMParser().parseFromString(xml, 'application/xml')
}

function serializeXml(document: Document): string {
  return new XMLSerializer().serializeToString(document)
}

function getElementsByLocalName(
  node: Document | Element,
  localName: string,
): Element[] {
  return Array.from(node.getElementsByTagName('*')).filter(
    (element) => element.localName === localName,
  )
}

function getFirstElementByLocalName(
  node: Document | Element,
  localName: string,
): Element | null {
  return getElementsByLocalName(node, localName)[0] ?? null
}

function getRelationshipId(element: Element): string | null {
  return (
    element.getAttributeNS(OFFICE_RELATIONSHIPS_NS, 'id') ||
    element.getAttribute('r:id') ||
    element.getAttribute('id')
  )
}

function getEmbedRelationshipId(element: Element): string | null {
  return (
    element.getAttributeNS(OFFICE_RELATIONSHIPS_NS, 'embed') ||
    element.getAttribute('r:embed') ||
    element.getAttribute('embed')
  )
}

function normalizeZipPath(path: string): string {
  const segments: string[] = []

  for (const segment of path.replace(/\\/g, '/').split('/')) {
    if (!segment || segment === '.') continue
    if (segment === '..') {
      segments.pop()
      continue
    }

    segments.push(segment)
  }

  return segments.join('/')
}

function resolveRelationshipTarget(sourcePath: string, target: string): string {
  if (target.startsWith('/')) {
    return normalizeZipPath(target.slice(1))
  }

  const basePath = sourcePath.split('/').slice(0, -1).join('/')
  return normalizeZipPath(`${basePath}/${target}`)
}

function buildRelsPath(partPath: string): string {
  const segments = partPath.split('/')
  const fileName = segments.pop()
  return `${segments.join('/')}/_rels/${fileName}.rels`
}

function getFileName(path: string): string {
  return path.split('/').pop() || 'sketch.emf'
}

function getExtension(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() || 'emf'
}

function getMimeType(extension: string): string {
  switch (extension.toLowerCase()) {
    case 'emf':
      return 'image/x-emf'
    case 'png':
      return 'image/png'
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg'
    case 'gif':
      return 'image/gif'
    default:
      return 'application/octet-stream'
  }
}

async function readZipText(zip: JSZip, path: string): Promise<string | null> {
  const file = zip.file(path)
  return file ? file.async('string') : null
}

async function getFirstWorksheetPath(zip: JSZip): Promise<string | null> {
  const workbookXml = await readZipText(zip, 'xl/workbook.xml')
  const workbookRelsXml = await readZipText(zip, 'xl/_rels/workbook.xml.rels')

  if (!workbookXml || !workbookRelsXml) {
    return zip.file('xl/worksheets/sheet1.xml')
      ? 'xl/worksheets/sheet1.xml'
      : null
  }

  const workbookDoc = parseXml(workbookXml)
  const workbookRelsDoc = parseXml(workbookRelsXml)
  const firstSheet = getFirstElementByLocalName(workbookDoc, 'sheet')
  const firstSheetRelId = firstSheet ? getRelationshipId(firstSheet) : null

  if (!firstSheetRelId) {
    return zip.file('xl/worksheets/sheet1.xml')
      ? 'xl/worksheets/sheet1.xml'
      : null
  }

  const relationship = getElementsByLocalName(
    workbookRelsDoc,
    'Relationship',
  ).find((item) => item.getAttribute('Id') === firstSheetRelId)
  const target = relationship?.getAttribute('Target')

  return target ? resolveRelationshipTarget('xl/workbook.xml', target) : null
}

function getRelationshipTarget(
  relationshipsXml: string,
  relationshipId: string,
): string | null {
  const document = parseXml(relationshipsXml)
  const relationship = getElementsByLocalName(document, 'Relationship').find(
    (item) => item.getAttribute('Id') === relationshipId,
  )

  return relationship?.getAttribute('Target') ?? null
}

export async function extractFirstWorksheetSketchFiles(
  xlsxData: ArrayBuffer,
): Promise<Map<number, WorkshopOrderSketchFile>> {
  const zip = await JSZip.loadAsync(xlsxData)
  const worksheetPath = await getFirstWorksheetPath(zip)

  if (!worksheetPath) {
    return new Map()
  }

  const worksheetXml = await readZipText(zip, worksheetPath)
  const worksheetRelsXml = await readZipText(zip, buildRelsPath(worksheetPath))

  if (!worksheetXml || !worksheetRelsXml) {
    return new Map()
  }

  const worksheetDoc = parseXml(worksheetXml)
  const drawingElement = getFirstElementByLocalName(worksheetDoc, 'drawing')
  const drawingRelId = drawingElement ? getRelationshipId(drawingElement) : null

  if (!drawingRelId) {
    return new Map()
  }

  const drawingTarget = getRelationshipTarget(worksheetRelsXml, drawingRelId)
  if (!drawingTarget) {
    return new Map()
  }

  const drawingPath = resolveRelationshipTarget(worksheetPath, drawingTarget)
  const drawingXml = await readZipText(zip, drawingPath)
  const drawingRelsXml = await readZipText(zip, buildRelsPath(drawingPath))

  if (!drawingXml || !drawingRelsXml) {
    return new Map()
  }

  const drawingDoc = parseXml(drawingXml)
  const result = new Map<number, WorkshopOrderSketchFile>()

  for (const anchor of getElementsByLocalName(drawingDoc, 'twoCellAnchor')) {
    const from = getFirstElementByLocalName(anchor, 'from')
    const rowText = from
      ? getFirstElementByLocalName(from, 'row')?.textContent
      : null
    const zeroBasedRow = rowText ? Number(rowText) : Number.NaN

    if (!Number.isInteger(zeroBasedRow)) {
      continue
    }

    const picture = getFirstElementByLocalName(anchor, 'pic')
    const blip = picture ? getFirstElementByLocalName(picture, 'blip') : null
    const imageRelId = blip ? getEmbedRelationshipId(blip) : null

    if (!imageRelId) {
      continue
    }

    const mediaTarget = getRelationshipTarget(drawingRelsXml, imageRelId)
    if (!mediaTarget) {
      continue
    }

    const mediaPath = resolveRelationshipTarget(drawingPath, mediaTarget)
    const mediaFile = zip.file(mediaPath)

    if (!mediaFile) {
      continue
    }

    const rowNumber = zeroBasedRow + 1
    if (result.has(rowNumber)) {
      continue
    }

    const fileName = getFileName(mediaPath)
    const extension = getExtension(fileName)
    result.set(rowNumber, {
      fileName,
      extension,
      mimeType: getMimeType(extension),
      data: await mediaFile.async('arraybuffer'),
    })
  }

  return result
}

function ensureWorksheetRelationship(
  worksheetRelsXml: string | null,
  worksheetPath: string,
  drawingPath: string,
): { xml: string; relationshipId: string } {
  const xmlDocument = worksheetRelsXml
    ? parseXml(worksheetRelsXml)
    : documentWithRoot('Relationships', RELATIONSHIPS_NS)
  const root = xmlDocument.documentElement
  const relationships = getElementsByLocalName(xmlDocument, 'Relationship')
  const existingDrawingRel = relationships.find(
    (item) => item.getAttribute('Type') === DRAWING_RELATIONSHIP_TYPE,
  )

  if (existingDrawingRel) {
    return {
      xml: serializeXml(xmlDocument),
      relationshipId: existingDrawingRel.getAttribute('Id') || 'rId1',
    }
  }

  const nextId = getNextRelationshipId(relationships)
  const relationship = xmlDocument.createElementNS(
    RELATIONSHIPS_NS,
    'Relationship',
  )
  relationship.setAttribute('Id', nextId)
  relationship.setAttribute('Type', DRAWING_RELATIONSHIP_TYPE)
  relationship.setAttribute('Target', relativePath(worksheetPath, drawingPath))
  root.appendChild(relationship)

  return { xml: serializeXml(xmlDocument), relationshipId: nextId }
}

function documentWithRoot(rootName: string, namespace: string): Document {
  return window.document.implementation.createDocument(namespace, rootName)
}

function getNextRelationshipId(relationships: Element[]): string {
  const maxId = relationships.reduce((max, relationship) => {
    const id = relationship.getAttribute('Id') || ''
    const match = id.match(/^rId(\d+)$/)
    return match ? Math.max(max, Number(match[1])) : max
  }, 0)

  return `rId${maxId + 1}`
}

function relativePath(fromFilePath: string, toFilePath: string): string {
  const fromParts = fromFilePath.split('/').slice(0, -1)
  const toParts = toFilePath.split('/')

  while (fromParts.length && toParts.length && fromParts[0] === toParts[0]) {
    fromParts.shift()
    toParts.shift()
  }

  return `${'../'.repeat(fromParts.length)}${toParts.join('/')}`
}

function ensureWorksheetDrawingElement(
  worksheetXml: string,
  relationshipId: string,
): string {
  const document = parseXml(worksheetXml)
  const root = document.documentElement
  let drawing = getFirstElementByLocalName(document, 'drawing')

  if (!root.getAttribute('xmlns:r')) {
    root.setAttribute('xmlns:r', OFFICE_RELATIONSHIPS_NS)
  }

  if (!drawing) {
    drawing = document.createElementNS(
      'http://schemas.openxmlformats.org/spreadsheetml/2006/main',
      'drawing',
    )
    root.appendChild(drawing)
  }

  drawing.setAttributeNS(OFFICE_RELATIONSHIPS_NS, 'r:id', relationshipId)
  return serializeXml(document)
}

function ensureContentTypesXml(
  contentTypesXml: string,
  drawingPath: string,
  images: WorksheetSketchPlacement[],
): string {
  const document = parseXml(contentTypesXml)
  const root = document.documentElement

  if (
    !getElementsByLocalName(document, 'Override').some(
      (item) => item.getAttribute('PartName') === `/${drawingPath}`,
    )
  ) {
    const override = document.createElementNS(CONTENT_TYPES_NS, 'Override')
    override.setAttribute('PartName', `/${drawingPath}`)
    override.setAttribute('ContentType', DRAWING_CONTENT_TYPE)
    root.appendChild(override)
  }

  for (const image of images) {
    const extension = image.extension.toLowerCase()
    const existingDefault = getElementsByLocalName(document, 'Default').some(
      (item) => item.getAttribute('Extension') === extension,
    )

    if (existingDefault) {
      continue
    }

    const defaultElement = document.createElementNS(CONTENT_TYPES_NS, 'Default')
    defaultElement.setAttribute('Extension', extension)
    defaultElement.setAttribute('ContentType', image.mimeType)
    root.appendChild(defaultElement)
  }

  return serializeXml(document)
}

function createTextElement(
  document: Document,
  namespace: string,
  name: string,
  value: string | number,
): Element {
  const element = document.createElementNS(namespace, name)
  element.textContent = String(value)
  return element
}

function createAnchor(
  document: Document,
  image: WorksheetSketchPlacement,
  relationshipId: string,
  index: number,
): Element {
  const zeroBasedColumn = Math.max(image.columnNumber ?? 1, 1) - 1
  const anchor = document.createElementNS(
    SPREADSHEET_DRAWING_NS,
    'xdr:twoCellAnchor',
  )
  anchor.setAttribute('editAs', 'oneCell')

  const from = document.createElementNS(SPREADSHEET_DRAWING_NS, 'xdr:from')
  from.appendChild(
    createTextElement(
      document,
      SPREADSHEET_DRAWING_NS,
      'xdr:col',
      zeroBasedColumn,
    ),
  )
  from.appendChild(
    createTextElement(document, SPREADSHEET_DRAWING_NS, 'xdr:colOff', 0),
  )
  from.appendChild(
    createTextElement(
      document,
      SPREADSHEET_DRAWING_NS,
      'xdr:row',
      image.rowNumber - 1,
    ),
  )
  from.appendChild(
    createTextElement(document, SPREADSHEET_DRAWING_NS, 'xdr:rowOff', 0),
  )

  const to = document.createElementNS(SPREADSHEET_DRAWING_NS, 'xdr:to')
  to.appendChild(
    createTextElement(
      document,
      SPREADSHEET_DRAWING_NS,
      'xdr:col',
      zeroBasedColumn + 1,
    ),
  )
  to.appendChild(
    createTextElement(document, SPREADSHEET_DRAWING_NS, 'xdr:colOff', 0),
  )
  to.appendChild(
    createTextElement(
      document,
      SPREADSHEET_DRAWING_NS,
      'xdr:row',
      image.rowNumber,
    ),
  )
  to.appendChild(
    createTextElement(document, SPREADSHEET_DRAWING_NS, 'xdr:rowOff', 0),
  )

  const pic = document.createElementNS(SPREADSHEET_DRAWING_NS, 'xdr:pic')
  const nvPicPr = document.createElementNS(
    SPREADSHEET_DRAWING_NS,
    'xdr:nvPicPr',
  )
  const cNvPr = document.createElementNS(SPREADSHEET_DRAWING_NS, 'xdr:cNvPr')
  cNvPr.setAttribute('id', String(index + 1))
  cNvPr.setAttribute('name', image.fileName)
  const cNvPicPr = document.createElementNS(
    SPREADSHEET_DRAWING_NS,
    'xdr:cNvPicPr',
  )
  const picLocks = document.createElementNS(DRAWING_MAIN_NS, 'a:picLocks')
  picLocks.setAttribute('noChangeAspect', '1')
  cNvPicPr.appendChild(picLocks)
  nvPicPr.appendChild(cNvPr)
  nvPicPr.appendChild(cNvPicPr)

  const blipFill = document.createElementNS(
    SPREADSHEET_DRAWING_NS,
    'xdr:blipFill',
  )
  const blip = document.createElementNS(DRAWING_MAIN_NS, 'a:blip')
  blip.setAttributeNS(OFFICE_RELATIONSHIPS_NS, 'r:embed', relationshipId)
  const stretch = document.createElementNS(DRAWING_MAIN_NS, 'a:stretch')
  stretch.appendChild(document.createElementNS(DRAWING_MAIN_NS, 'a:fillRect'))
  blipFill.appendChild(blip)
  blipFill.appendChild(document.createElementNS(DRAWING_MAIN_NS, 'a:srcRect'))
  blipFill.appendChild(stretch)

  const spPr = document.createElementNS(SPREADSHEET_DRAWING_NS, 'xdr:spPr')
  const prstGeom = document.createElementNS(DRAWING_MAIN_NS, 'a:prstGeom')
  prstGeom.setAttribute('prst', 'rect')
  prstGeom.appendChild(document.createElementNS(DRAWING_MAIN_NS, 'a:avLst'))
  spPr.appendChild(prstGeom)

  pic.appendChild(nvPicPr)
  pic.appendChild(blipFill)
  pic.appendChild(spPr)

  anchor.appendChild(from)
  anchor.appendChild(to)
  anchor.appendChild(pic)
  anchor.appendChild(
    document.createElementNS(SPREADSHEET_DRAWING_NS, 'xdr:clientData'),
  )

  return anchor
}

function createDrawingXml(images: WorksheetSketchPlacement[]): {
  drawingXml: string
  drawingRelsXml: string
  media: Array<{ path: string; data: ArrayBuffer }>
} {
  const drawingDoc = document.implementation.createDocument(
    SPREADSHEET_DRAWING_NS,
    'xdr:wsDr',
  )
  const drawingRoot = drawingDoc.documentElement
  drawingRoot.setAttribute('xmlns:a', DRAWING_MAIN_NS)
  drawingRoot.setAttribute('xmlns:r', OFFICE_RELATIONSHIPS_NS)

  const relsDoc = documentWithRoot('Relationships', RELATIONSHIPS_NS)
  const media: Array<{ path: string; data: ArrayBuffer }> = []

  images.forEach((image, index) => {
    const relationshipId = `rId${index + 1}`
    const mediaPath = `xl/media/workshop-sketch-${index + 1}.${image.extension}`
    const relationship = relsDoc.createElementNS(
      RELATIONSHIPS_NS,
      'Relationship',
    )
    relationship.setAttribute('Id', relationshipId)
    relationship.setAttribute('Type', IMAGE_RELATIONSHIP_TYPE)
    relationship.setAttribute(
      'Target',
      `../media/workshop-sketch-${index + 1}.${image.extension}`,
    )
    relsDoc.documentElement.appendChild(relationship)
    drawingRoot.appendChild(
      createAnchor(drawingDoc, image, relationshipId, index),
    )
    media.push({ path: mediaPath, data: image.data })
  })

  return {
    drawingXml: serializeXml(drawingDoc),
    drawingRelsXml: serializeXml(relsDoc),
    media,
  }
}

export async function embedSketchFilesIntoFirstWorksheet(
  workbookBuffer: ArrayBuffer,
  images: WorksheetSketchPlacement[],
): Promise<ArrayBuffer> {
  const validImages = images.filter((image) => image.data.byteLength > 0)

  if (validImages.length === 0) {
    return workbookBuffer
  }

  const zip = await JSZip.loadAsync(workbookBuffer)
  const worksheetPath =
    (await getFirstWorksheetPath(zip)) || 'xl/worksheets/sheet1.xml'
  const worksheetXml = await readZipText(zip, worksheetPath)
  const contentTypesXml = await readZipText(zip, '[Content_Types].xml')

  if (!worksheetXml || !contentTypesXml) {
    return workbookBuffer
  }

  const drawingPath = 'xl/drawings/drawing1.xml'
  const worksheetRelsPath = buildRelsPath(worksheetPath)
  const drawingRelsPath = buildRelsPath(drawingPath)
  const { drawingXml, drawingRelsXml, media } = createDrawingXml(validImages)
  const { xml: worksheetRelsXml, relationshipId } = ensureWorksheetRelationship(
    await readZipText(zip, worksheetRelsPath),
    worksheetPath,
    drawingPath,
  )

  zip.file(
    worksheetPath,
    ensureWorksheetDrawingElement(worksheetXml, relationshipId),
  )
  zip.file(worksheetRelsPath, worksheetRelsXml)
  zip.file(drawingPath, drawingXml)
  zip.file(drawingRelsPath, drawingRelsXml)
  zip.file(
    '[Content_Types].xml',
    ensureContentTypesXml(contentTypesXml, drawingPath, validImages),
  )

  for (const item of media) {
    zip.file(item.path, item.data)
  }

  return zip.generateAsync({
    type: 'arraybuffer',
    compression: 'DEFLATE',
  })
}
