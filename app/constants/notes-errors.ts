export const NOTES_ERROR_CODES = {
  readFailed: 'read-failed',
  invalidData: 'invalid-data',
  unsupportedVersion: 'unsupported-version',
  writeFailed: 'write-failed',
  notFound: 'not-found',
} as const

export type NotesErrorCode = (typeof NOTES_ERROR_CODES)[keyof typeof NOTES_ERROR_CODES]
