import { describe, it, expect } from 'vitest';
import { buildPrompt } from '../prompt';

describe('buildPrompt', () => {
  it('builds prompt with required fields only', () => {
    const result = buildPrompt({
      storyTitle: 'User Login',
      acceptanceCriteria: 'Given valid credentials, user can login',
    });
    expect(result).toContain('STORY TITLE:\nUser Login');
    expect(result).toContain('ACCEPTANCE CRITERIA:\nGiven valid credentials, user can login');
    expect(result).not.toContain('DESCRIPTION:');
    expect(result).not.toContain('PRD CONTEXT');
    expect(result).not.toContain('ADDITIONAL NOTES');
  });

  it('includes description when provided', () => {
    const result = buildPrompt({
      storyTitle: 'User Login',
      acceptanceCriteria: 'AC here',
      description: 'As a user, I want to login',
    });
    expect(result).toContain('DESCRIPTION:\nAs a user, I want to login');
  });

  it('includes PRD content when provided', () => {
    const result = buildPrompt({
      storyTitle: 'User Login',
      acceptanceCriteria: 'AC here',
      prdContent: 'Extracted PRD text from attached document',
    });
    expect(result).toContain('PRD CONTEXT (extracted from attached documents):\nExtracted PRD text from attached document');
  });

  it('includes additional notes when provided', () => {
    const result = buildPrompt({
      storyTitle: 'User Login',
      acceptanceCriteria: 'AC here',
      additionalInfo: 'Must support SSO',
    });
    expect(result).toContain('ADDITIONAL NOTES:\nMust support SSO');
  });

  it('joins sections with separator', () => {
    const result = buildPrompt({
      storyTitle: 'Login',
      acceptanceCriteria: 'AC',
      description: 'Desc',
    });
    expect(result).toContain('\n\n---\n\n');
  });

  it('builds complete prompt with all fields', () => {
    const result = buildPrompt({
      storyTitle: 'Login Feature',
      acceptanceCriteria: 'Given/When/Then',
      description: 'User story description',
      prdContent: 'PRD doc text',
      additionalInfo: 'Extra notes',
    });

    const sections = result.split('\n\n---\n\n');
    expect(sections).toHaveLength(5);
    expect(sections[0]).toContain('STORY TITLE:');
    expect(sections[1]).toContain('DESCRIPTION:');
    expect(sections[2]).toContain('ACCEPTANCE CRITERIA:');
    expect(sections[3]).toContain('PRD CONTEXT');
    expect(sections[4]).toContain('ADDITIONAL NOTES:');
  });

  it('omits empty optional fields', () => {
    const result = buildPrompt({
      storyTitle: 'Login',
      acceptanceCriteria: 'AC',
      description: '',
      prdContent: '',
      additionalInfo: '',
    });
    expect(result).not.toContain('DESCRIPTION:');
    expect(result).not.toContain('PRD CONTEXT');
    expect(result).not.toContain('ADDITIONAL NOTES');
  });
});
