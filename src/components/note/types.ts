import { Note } from '../board/types'
export { Note } from '../board/types'

export type NoteState = {
  note: Note
  isEditing: boolean
  isDragging: boolean
}
