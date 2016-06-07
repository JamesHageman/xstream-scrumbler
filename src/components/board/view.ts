import { Stream } from 'xstream'
import { State, Note } from './types'
import { div, p, textarea, section, button } from '@cycle/dom'
import { NOTE_HEIGHT, NOTE_WIDTH } from './constants'
import * as R from 'ramda'

const boardStyle = {
  'width': '1200px',
  'position': 'relative'
}

const columnStyle = {
  'border-color': 'grey',
  'flex-grow': '1',
  'min-height': '600px',
}

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

export const view = (state$: Stream<State>, 
  onNoteEditStart: (val: string) => void) => {
  return state$.map(state => section('.js-container.p1', [ 
    div('.clearfix.flex.mb1', 
      { style: boardStyle }, 
      R.values(state.boards).map(board => 
        div('.p1.border-left.border.right.border-bottom.mx-auto', 
          { style: columnStyle, key: board.name }, [ 
          p('.center.m0', [ board.name ]) 
        ])
      )
    ),
    
    div('.p1', {
      style: {
        'min-height': '200px',
      }
    }, [
      button('.js-add-note', [ 'Add a note' ])
    ]),
    
    ...R.values(state.notes).map(note => 
      div('.js-note.border.flex', { 
        style: R.mergeAll([
          noteStyle(note),
          note.id === state.draggingNoteId ? {
            'box-shadow': '0px 1px 3px 3px #eee'
          } : {}
        ]),
        attrs: { 'data-note': note.id },
        key: `note-${note.id}`
      }, [
        state.editingNoteId === note.id ? 
          textarea('.js-note-edit', {
            style: textAreaStyle,
            attrs: { autofocus: true, tabindex: 0, 'data-note': note.id },
            props: { onclick: stopPropagation, }
          }, [note.label]) 
        : 
          div([
            note.label,
            button({
              props: {
                onmousedown: stopPropagation,
                onclick: (e) => {
                  e.stopPropagation()
                  onNoteEditStart(note.id)
                }  
              }
            }, [ 'edit' ])
          ]),
      ])
    ) 
      
  ]))
}
