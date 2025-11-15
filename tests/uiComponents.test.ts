import { describe, it, expect } from 'vitest'
import * as React from 'react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Progress } from '../components/ui/progress'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card'

describe('UI Components', () => {
  it('Button applies variant and size classes', () => {
    const el: any = Button({ variant: 'outline', size: 'lg', children: 'Click' })
    expect(el.type).toBe('button')
    const cls = String(el.props.className)
    expect(cls).toContain('border-sage-300')
    expect(cls).toContain('h-12')
  })

  it('Input has base classes and accepts aria-label', () => {
    // Input is a forwardRef component, so we need to call its render function
    const el: any = (Input as any).render({ 'aria-label': 'Property address' }, null)
    expect(el.type).toBe('input')
    expect(String(el.props.className)).toContain('border-sage-300')
    expect(el.props['aria-label']).toBe('Property address')
  })

  it('Progress clamps value and sets width style', () => {
    const el: any = Progress({ value: 150 })
    expect(el.type).toBe('div')
    const child = el.props.children
    expect(child.type).toBe('div')
    expect(child.props.style.width).toBe('100%')
  })

  it('Card components render with expected tags and classes', () => {
    const card: any = Card({ children: 'content' })
    const header: any = CardHeader({ children: 'header' })
    const title: any = CardTitle({ children: 'title' })
    const content: any = CardContent({ children: 'text' })
    expect(card.type).toBe('div')
    expect(String(card.props.className)).toContain('border')
    expect(header.type).toBe('div')
    expect(title.type).toBe('h3')
    expect(content.type).toBe('div')
  })
})

