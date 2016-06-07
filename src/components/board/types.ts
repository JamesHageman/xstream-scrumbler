export interface Board {
  name: string
}

export interface Position {
  x: number
  y: number
}

export interface Note {
  pos: Position
  label: string
  id: string
}

export interface NoteMap {[id: string]: Note}

export interface BootstrapMessage {
  boards: {
    [id: string]: Board
  }
  notes: NoteMap,
}

export interface State extends BootstrapMessage {
  editingNoteId: string
  draggingNoteId: string
}

export interface NoteEvent {
  id: string
  x: number
  y: number
}
