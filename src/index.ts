import './styles/index.css'
import { makeDOMDriver, DOMSource, VNode } from '@cycle/dom'
import Cycle from '@cycle/xstream-run'
import Board from './components/board'
import { BootstrapMessage } from './components/board/types'
import { Stream } from 'xstream'
import isolate from '@cycle/isolate'
import {
  createWebsocketDriver,
  WebsocketSource,
  EmitMessage
} from './drivers/websocket'
import { createFocusDriver } from './drivers/focus'

interface Sources {
  DOM: DOMSource,
  websocket: WebsocketSource
}

interface Sinks {
  DOM: Stream<VNode>
  websocket: Stream<EmitMessage>
  preventDefault: Stream<Event>
  focus: Stream<string>
}

function main(sources: Sources): Sinks {
  const stateUpdate$ = sources.websocket.get('state-update')
    .map(msg => msg.data as BootstrapMessage)
  const board = isolate(Board)(sources, stateUpdate$)

  const boardWebsocket$ = Stream.merge(
    board.moveNote$.map(noteEvent => ({
      type: 'move-note',
      data: noteEvent,
    })),
    board.addNote$.mapTo({ type: 'add-note' }),
    board.editNote$.map(({ id, label }) => ({
      type: 'change-note-label',
      data: { id, label }
    })),
    board.noteDelete$.map(id => ({
      type: 'delete-note',
      data: { id }
    }))
  )

  return {
    DOM: board.DOM,
    websocket: Stream.merge(boardWebsocket$, Stream.of({ type: 'init' }))
      .debug('websocket$'),
    preventDefault: board.preventDefault,
    focus: board.focus,
  }
}

Cycle.run(main, {
  DOM: makeDOMDriver('#root'),
  websocket: createWebsocketDriver('http://localhost:3000'),
  focus: createFocusDriver(),
  preventDefault: (event$: Stream<Event>) => {
    event$.addListener({
      next: (e) => e.preventDefault(),
      error: (err) => console.error(err),
      complete: () => {}
    })
    return {}
  },
})
