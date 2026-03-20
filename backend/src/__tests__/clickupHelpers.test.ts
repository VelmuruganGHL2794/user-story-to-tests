import { describe, it, expect } from 'vitest';
import { extractAcceptanceCriteria, filterPrdAttachments } from '../integrations/clickupClient';
import type { ClickUpTask, Attachment } from '../integrations/clickupClient';

describe('extractAcceptanceCriteria', () => {
  it('extracts AC from custom field named "Acceptance Criteria"', () => {
    const task: ClickUpTask = {
      id: '1',
      name: 'Test Task',
      description: 'Some description',
      custom_fields: [
        { name: 'Acceptance Criteria', value: 'Given valid creds\nWhen user logs in\nThen dashboard shown' },
      ],
    };
    expect(extractAcceptanceCriteria(task)).toBe('Given valid creds\nWhen user logs in\nThen dashboard shown');
  });

  it('is case-insensitive for custom field name', () => {
    const task: ClickUpTask = {
      id: '1',
      name: 'Test',
      description: '',
      custom_fields: [
        { name: 'acceptance criteria', value: 'AC from lowercase field' },
      ],
    };
    expect(extractAcceptanceCriteria(task)).toBe('AC from lowercase field');
  });

  it('falls back to ## Acceptance Criteria heading in description', () => {
    const task: ClickUpTask = {
      id: '1',
      name: 'Test',
      description: '## Overview\nSome overview\n## Acceptance Criteria\n- AC item 1\n- AC item 2\n## Notes\nSome notes',
      custom_fields: [],
    };
    expect(extractAcceptanceCriteria(task)).toBe('- AC item 1\n- AC item 2');
  });

  it('falls back to **Acceptance Criteria** bold heading in description', () => {
    const task: ClickUpTask = {
      id: '1',
      name: 'Test',
      description: '**Acceptance Criteria**\n- User can login\n- User sees errors\n**Notes**\nExtra info',
      custom_fields: [],
    };
    expect(extractAcceptanceCriteria(task)).toBe('- User can login\n- User sees errors');
  });

  it('returns empty string when no AC found anywhere', () => {
    const task: ClickUpTask = {
      id: '1',
      name: 'Test',
      description: 'Just a plain description with no AC section',
      custom_fields: [],
    };
    expect(extractAcceptanceCriteria(task)).toBe('');
  });

  it('prefers custom field over description', () => {
    const task: ClickUpTask = {
      id: '1',
      name: 'Test',
      description: '## Acceptance Criteria\nFrom description',
      custom_fields: [
        { name: 'Acceptance Criteria', value: 'From custom field' },
      ],
    };
    expect(extractAcceptanceCriteria(task)).toBe('From custom field');
  });
});

describe('filterPrdAttachments', () => {
  const makeAttachment = (title: string, ext: string): Attachment => ({
    id: '1', title, url: 'https://example.com/file', extension: ext, size: 1024,
  });

  it('includes .pdf files', () => {
    const result = filterPrdAttachments([makeAttachment('document.pdf', 'pdf')]);
    expect(result).toHaveLength(1);
  });

  it('includes .docx files', () => {
    const result = filterPrdAttachments([makeAttachment('spec.docx', 'docx')]);
    expect(result).toHaveLength(1);
  });

  it('includes .doc files', () => {
    const result = filterPrdAttachments([makeAttachment('old-spec.doc', 'doc')]);
    expect(result).toHaveLength(1);
  });

  it('includes files with PRD keyword regardless of extension', () => {
    const result = filterPrdAttachments([makeAttachment('PRD-login.txt', 'txt')]);
    expect(result).toHaveLength(1);
  });

  it('includes files with "requirements" keyword', () => {
    const result = filterPrdAttachments([makeAttachment('product-requirements-v2.xlsx', 'xlsx')]);
    expect(result).toHaveLength(1);
  });

  it('excludes non-matching files', () => {
    const result = filterPrdAttachments([
      makeAttachment('screenshot.png', 'png'),
      makeAttachment('design-mockup.fig', 'fig'),
    ]);
    expect(result).toHaveLength(0);
  });

  it('handles mixed attachments correctly', () => {
    const result = filterPrdAttachments([
      makeAttachment('PRD_Login.pdf', 'pdf'),
      makeAttachment('screenshot.png', 'png'),
      makeAttachment('notes.docx', 'docx'),
      makeAttachment('logo.svg', 'svg'),
    ]);
    expect(result).toHaveLength(2);
    expect(result.map((a) => a.title)).toEqual(['PRD_Login.pdf', 'notes.docx']);
  });
});
