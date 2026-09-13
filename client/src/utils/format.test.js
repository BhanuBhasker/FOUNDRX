import { describe, expect, it } from 'vitest';
import { titleCase, initials } from './format.js';

describe('titleCase', () => {
  it('converts snake_case to Title Case', () => {
    expect(titleCase('full_time')).toBe('Full Time');
  });

  it('returns an empty string for falsy input', () => {
    expect(titleCase(undefined)).toBe('');
  });
});

describe('initials', () => {
  it('takes the first letter of the first two words', () => {
    expect(initials('Ada Lovelace')).toBe('AL');
  });

  it('falls back to a question mark when no name is given', () => {
    expect(initials('')).toBe('?');
  });
});
