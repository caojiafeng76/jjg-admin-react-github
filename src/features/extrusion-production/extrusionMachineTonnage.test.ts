import { describe, expect, it } from 'vitest'

import {
  extractExtrusionTonnage,
  getBilletDiameterDefaultsByTonnage,
  getBilletDiameterPreset,
} from './extrusionMachineTonnage'

describe('extractExtrusionTonnage', () => {
  it('parses standard tonnage names', () => {
    expect(extractExtrusionTonnage('680T')).toBe(680)
    expect(extractExtrusionTonnage('1000T')).toBe(1000)
    expect(extractExtrusionTonnage('1400T')).toBe(1400)
  })

  it('is case-insensitive for the T suffix', () => {
    expect(extractExtrusionTonnage('680t')).toBe(680)
    expect(extractExtrusionTonnage('1000t')).toBe(1000)
  })

  it('parses tonnage embedded in a longer name', () => {
    expect(extractExtrusionTonnage('挤压机 1000T 主力')).toBe(1000)
  })

  it('returns null for unsupported tonnage', () => {
    expect(extractExtrusionTonnage('800T')).toBeNull()
    expect(extractExtrusionTonnage('2.5米')).toBeNull()
  })

  it('returns null for empty / nullish input', () => {
    expect(extractExtrusionTonnage(null)).toBeNull()
    expect(extractExtrusionTonnage(undefined)).toBeNull()
    expect(extractExtrusionTonnage('')).toBeNull()
  })
})

describe('getBilletDiameterPreset', () => {
  it('returns expected preset for 680T', () => {
    expect(getBilletDiameterPreset(680)).toEqual({
      defaultDiameterMm: 90,
      quickPickDiametersMm: [90],
    })
  })

  it('returns expected preset for 1000T', () => {
    expect(getBilletDiameterPreset(1000)).toEqual({
      defaultDiameterMm: 120,
      quickPickDiametersMm: [120],
    })
  })

  it('returns expected preset for 1400T', () => {
    expect(getBilletDiameterPreset(1400)).toEqual({
      defaultDiameterMm: 150,
      quickPickDiametersMm: [150, 180],
    })
  })

  it('returns null when tonnage is null', () => {
    expect(getBilletDiameterPreset(null)).toBeNull()
  })
})

describe('getBilletDiameterDefaultsByTonnage', () => {
  it('exposes all three tonnage presets', () => {
    const defaults = getBilletDiameterDefaultsByTonnage()
    expect(Object.keys(defaults).sort()).toEqual(['1000', '1400', '680'])
  })
})
