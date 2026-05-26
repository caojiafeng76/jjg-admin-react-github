import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

describe('testing library setup', () => {
  it('renders React components in jsdom', () => {
    render(<button type="button">测试通过</button>)

    expect(screen.getByRole('button', { name: '测试通过' })).toBeInTheDocument()
  })
})
