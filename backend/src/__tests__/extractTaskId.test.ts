import { describe, it, expect } from 'vitest';
import { extractTaskId } from '../integrations/clickupClient';

describe('extractTaskId', () => {
  it('extracts task ID from full ClickUp URL with workspace', () => {
    expect(extractTaskId('https://app.clickup.com/t/12345/86a1b2c3d')).toBe('86a1b2c3d');
  });

  it('extracts task ID from short ClickUp URL', () => {
    expect(extractTaskId('https://app.clickup.com/t/86a1b2c3d')).toBe('86a1b2c3d');
  });

  it('extracts task ID from URL with trailing slash', () => {
    expect(extractTaskId('https://app.clickup.com/t/86a1b2c3d/')).toBe('86a1b2c3d');
  });

  it('accepts raw alphanumeric task ID', () => {
    expect(extractTaskId('86a1b2c3d')).toBe('86a1b2c3d');
  });

  it('trims whitespace from raw task ID', () => {
    expect(extractTaskId('  86a1b2c3d  ')).toBe('86a1b2c3d');
  });

  it('throws on invalid input with special characters', () => {
    expect(() => extractTaskId('not a valid @ url !!')).toThrow('Invalid ClickUp task URL or ID');
  });

  it('throws on empty string', () => {
    expect(() => extractTaskId('')).toThrow('Invalid ClickUp task URL or ID');
  });

  it('throws on URL without /t/ path', () => {
    expect(() => extractTaskId('https://app.clickup.com/dashboard')).toThrow('Invalid ClickUp task URL or ID');
  });
});
