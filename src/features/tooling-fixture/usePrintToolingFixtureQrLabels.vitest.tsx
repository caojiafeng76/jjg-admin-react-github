import { describe, expect, it } from 'vitest'

import type { ToolingFixture } from '@/services/apiToolingFixture'
import { buildToolingFixtureQrLabelsHtml } from './usePrintToolingFixtureQrLabels'

function makeFixture(index: number): ToolingFixture {
  return {
    id: String(index),
    qr_token: `fixture-token-${index}`,
    fixture_no: `FIX-${String(index).padStart(3, '0')}`,
    product_name: `产品${index}`,
  } as ToolingFixture
}

describe('buildToolingFixtureQrLabelsHtml', () => {
  it('renders 10 labels in one A4 page for 10 items', () => {
    const items = Array.from({ length: 10 }, (_, index) => makeFixture(index))
    const html = buildToolingFixtureQrLabelsHtml(items)

    expect(html).toContain('<!DOCTYPE html>')
    expect(html.match(/class="page"/g)).toHaveLength(1)
    expect(html.match(/class="label"/g)).toHaveLength(10)
  })

  it('splits 11 items into 2 pages (10 + 1)', () => {
    const items = Array.from({ length: 11 }, (_, index) => makeFixture(index))
    const html = buildToolingFixtureQrLabelsHtml(items)

    expect(html.match(/class="page"/g)).toHaveLength(2)
    expect(html.match(/class="label"/g)).toHaveLength(11)
    expect(html.indexOf('<div class="page">')).toBeLessThan(
      html.lastIndexOf('<div class="page">'),
    )
  })

  it('renders three lines per label: QR, fixture no and product name', () => {
    const html = buildToolingFixtureQrLabelsHtml([makeFixture(1)])

    expect(html).toContain('FIX-001')
    expect(html).toContain('产品1')
    expect(html).toContain('<svg')
  })

  it('encodes a distinct QR code per fixture token', () => {
    const htmlA = buildToolingFixtureQrLabelsHtml([makeFixture(1)])
    const htmlB = buildToolingFixtureQrLabelsHtml([makeFixture(2)])

    expect(htmlA).toContain('<svg')
    expect(htmlB).toContain('<svg')
    expect(htmlA).not.toBe(htmlB)
  })

  it('escapes html-sensitive fixture no and product name', () => {
    const item = makeFixture(1)
    item.fixture_no = 'FIX-<b>01</b>'
    item.product_name = '产品&"测试"'
    const html = buildToolingFixtureQrLabelsHtml([item])

    expect(html).toContain('FIX-&lt;b&gt;01&lt;/b&gt;')
    expect(html).not.toContain('<b>01</b>')
    expect(html).toContain('产品&amp;&quot;测试&quot;')
  })
})
