import type { NoteContent } from './note'

export interface NoteDraft {
  schemaVersion: 1
  noteId: string | null
  content: NoteContent
}
