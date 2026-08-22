import { describe, expect, it } from 'vitest'

import { classifyError, MMX_EXIT_CODE } from './errors.js'

function errorWithExitCode(exitCode: number): Error {
  return Object.assign(new Error('boom'), { exitCode })
}

describe('classifyError', () => {
  it('classifies AUTH', () => {
    expect(classifyError(errorWithExitCode(MMX_EXIT_CODE.AUTH))).toBe('minimax_auth')
  })

  it('classifies QUOTA', () => {
    expect(classifyError(errorWithExitCode(MMX_EXIT_CODE.QUOTA))).toBe('minimax_quota')
  })

  it('classifies TIMEOUT (via exitCode)', () => {
    expect(classifyError(errorWithExitCode(MMX_EXIT_CODE.TIMEOUT))).toBe('minimax_timeout')
  })

  it('classifies NETWORK', () => {
    expect(classifyError(errorWithExitCode(MMX_EXIT_CODE.NETWORK))).toBe('minimax_network')
  })

  it('classifies CONTENT_FILTER', () => {
    expect(classifyError(errorWithExitCode(MMX_EXIT_CODE.CONTENT_FILTER))).toBe(
      'minimax_content_filter',
    )
  })

  it('classifies USAGE as invalid_params', () => {
    expect(classifyError(errorWithExitCode(MMX_EXIT_CODE.USAGE))).toBe('invalid_params')
  })

  it('classifies GENERAL (or any other numeric exitCode) as minimax_error', () => {
    expect(classifyError(errorWithExitCode(MMX_EXIT_CODE.GENERAL))).toBe('minimax_error')
    expect(classifyError(errorWithExitCode(999))).toBe('minimax_error')
  })

  it('classifies a fetch AbortSignal.timeout() DOMException-shaped error as "timeout", by name — not exitCode', () => {
    const err = new Error('The operation timed out.')
    err.name = 'TimeoutError'
    expect(classifyError(err)).toBe('timeout')
  })

  it('classifies an AbortError by name as "timeout"', () => {
    const err = new Error('aborted')
    err.name = 'AbortError'
    expect(classifyError(err)).toBe('timeout')
  })

  it('classifies a plain Error with no exitCode as "unknown"', () => {
    expect(classifyError(new Error('mystery'))).toBe('unknown')
  })

  it('classifies a non-Error thrown value as "unknown"', () => {
    expect(classifyError('just a string')).toBe('unknown')
    expect(classifyError(null)).toBe('unknown')
    expect(classifyError(undefined)).toBe('unknown')
  })
})
