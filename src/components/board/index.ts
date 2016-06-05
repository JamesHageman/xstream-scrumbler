import { Stream } from 'xstream'
import dropRepeats from 'xstream/extra/dropRepeats'
import { div, p, a, section, button, DOMSource } from '@cycle/dom'
import isolate from '@cycle/isolate'
import * as R from 'ramda'
import createEventHandler from '../../util/create-event-handler'

interface Board {
  name: string
}

interface Position {
  x: number
  y: number
}

interface Note {
  pos: Position
  label: string
  id: string
}

interface NoteMap {[id: string]: Note}

interface State {
  boards: {
    [id: string]: Board
  }
  notes: NoteMap
}

interface Sources { 
  DOM: DOMSource 
}

interface NoteEvent {
  id: string
  x: number
  y: number
}

const initialState : State = {
  boards: {
    0: { name: 'Backlog' },
    1: { name: 'Doing' }, 
    2: { name: 'Done' }
  },
  notes: {
    1: {
      pos: { x: 100, y: 100 }, 
      label: 'asdf', 
      id: '1'
    }
  }
}

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

const getNextNoteId = R.pipe
  <NoteMap, Note[], string[], string[], string, string>(
  R.values,
  R.map<Note, string>(note => note.id),
  R.sortBy(id => id),
  R.last,
  (id) => (parseInt(id, 10) + 1).toString()
)

function Board(sources: Sources) {
  const { 
    stream: noteMouseDown$, 
    handler: onNoteMouseDown 
  } = createEventHandler<NoteEvent>()
  
  const mouseMove$ = sources.DOM.select('.js-container')
    .events('mousemove') as Stream<MouseEvent>
  const mouseUp$ = sources.DOM.select('.js-container')
    .events('mouseup') as Stream<MouseEvent>
  
  const addNote$ = sources.DOM.select('.js-add-note')
    .events('click') as Stream<MouseEvent>
  
  const addNoteMod$ = addNote$.mapTo((state: State) => {
    const newId = getNextNoteId(state.notes)
    
    const update = R.set(
      R.lensPath(['notes', newId]),
      { id: newId, pos: { x: 0, y: 0 }, label: '...' } as Note
    )
    
    return update(state)
  })
  
  const noteDrag$ = noteMouseDown$.map(({ id }) => 
    mouseMove$.map(e => ({
      id: id,
      x: e.clientX,
      y: e.clientY
    }))
    .compose(dropRepeats((a: any, b: any) => 
      a.x === b.x && a.y === b.y
    ))
    .endWhen(mouseUp$)
  ).flatten()
  
  const noteDragMod$ = noteDrag$.map(({ id, x, y }) => (state: State) => {
    const update = R.set(
      R.lensPath(['notes', id, 'pos']),
      { x, y } as Position
    )
    return update(state)
  })
  
  const mod$ = Stream.merge(noteDragMod$, addNoteMod$)
  
  const state$ = mod$.fold((state, mod) => mod(state), initialState)
    .debug('state$')

  const view$ = state$.map(state => section('.js-container.p1', [ 
    div('.clearfix.flex.mb1', 
      { style: boardStyle }, 
      R.values(state.boards).map(board => 
        div('.p1.border-left.border.right.border-bottom.mx-auto', 
          { style: columnStyle }, [ 
          p('.center.m0', [ board.name ]) 
        ])
      )
    ),
    
    div('.border.p1', [
      button('.js-add-note', [ 'Add a note' ])
    ]),
    
    ...R.values(state.notes).map(note => 
      div('.js-note.border', { 
        style: noteStyle(note),
        props: {
          onmousedown: (ev: MouseEvent) => onNoteMouseDown({
            id: note.id,
            x: ev.clientX,
            y: ev.clientY
          })
        }
      }, [ 
        note.label,
        a([ 'edit' ])
      ])
    ) 
      
  ]))
  
  return {
    DOM: view$,
    preventDefault: mouseMove$.map(e => noteDrag$.mapTo(e)).flatten()
  }
}

export default (sources: Sources) => isolate(Board)(sources)
