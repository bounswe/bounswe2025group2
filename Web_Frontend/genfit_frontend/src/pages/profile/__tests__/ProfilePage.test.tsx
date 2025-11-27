//minimal test for now
// import React from 'react'
import { describe, it, expect } from 'vitest'
import ProfilePage from '../ProfilePage'

describe('ProfilePage — sanity', () => {
  it('exports a React component', () => {
    expect(typeof ProfilePage).toBe('function')
    // Optional: ensure it has a displayName or name
    expect(ProfilePage.name.length).toBeGreaterThan(0)
  })
})
