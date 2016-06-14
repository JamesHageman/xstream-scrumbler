import { Stream } from 'xstream'
import { Note, NoteState } from './types'
import { div, textarea, button } from '@cycle/dom'
import { NOTE_HEIGHT, NOTE_WIDTH } from './constants'

const noteStyle = (note: Note) => ({
  'width': `${NOTE_WIDTH}px`,
  'min-height': `${NOTE_HEIGHT}px`,
  'position': 'absolute',
  'cursor': 'pointer',
  'top': '0px',
  'left': '0px',
  'background-color': 'white',
  'transform': `translate3d(${note.pos.x}px, ${note.pos.y}px, 0px)`,
  'font-size': '0.7rem',
  'text-align': 'center',
  'overflow': 'hidden',
  'border-radius': '3px',
  'padding': '3px'
})

const textAreaStyle = {
  'position': 'relative',
  'text-align': 'center',
  'border': 'none',
  'width': '100%',
  'resize': 'none'
}

const stopPropagation = (e: MouseEvent) => {
  e.stopPropagation()
}

export default function view(state$: Stream<NoteState>) {
  return state$.map(({ note, isEditing, isDragging }) =>
    div('.js-note.border.flex', {
        style: R.mergeAll([
          noteStyle(note),
          isDragging ? {
            'box-shadow': '0px 1px 3px 3px #eee'
          } : {}
        ]),
        attrs: { 'data-note': note.id },
        key: `note-${note.id}`
      }, [
        isEditing ?
          textarea('.js-note-edit', {
            style: textAreaStyle,
            props: { onclick: stopPropagation, }
          }, [note.label])
        :
          div('.flex.flex-column', [
            div('.flex-auto', [ note.label ]),
            div('.flex.content-between', [
              button('.js-edit-btn', {
                props: {
                  onmousedown: stopPropagation,
                }
              }, [ 'edit' ]),
              button('.js-delete-btn', {
                props: {
                  onmousedown: stopPropagation,
                }
              }, [ 'x' ])
            ])
          ]),
      ]))
}
