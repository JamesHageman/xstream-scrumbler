import { Stream } from 'xstream'
import { State, Note } from './types'
import { div, p, textarea, section, button } from '@cycle/dom'
import * as R from 'ramda'

const boardStyle = {
  'width': '800px',
  'position': 'relative'
}

const columnStyle = {
  'border-color': 'grey',
  'flex-grow': '1',
  'min-height': '400px',
}

const noteStyle = (note: Note) => ({
  'width': '60px',
  'height': '60px',
  'position': 'absolute',
  'cursor': 'pointer',
  'top': '0px',
  'left': '0px',
  'background-color': 'white',
  'transform': `translate3d(${note.pos.x}px, ${note.pos.y}px, 0px)`,
})

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
          { style: columnStyle }, [ 
          p('.center.m0', [ board.name ]) 
        ])
      )
    ),
    
    div('.p1', [
      button('.js-add-note', [ 'Add a note' ])
    ]),
    
    ...R.values(state.notes).map(note => 
      div('.js-note.border', { 
        style: noteStyle(note),
        attrs: { 'data-note': note.id },
      }, [ 
        state.editingNoteId === note.id ? 
          textarea('.js-note-edit', { 
            attrs: { autofocus: true, 'data-note': note.id },
            props: { onclick: stopPropagation }
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
