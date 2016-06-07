const R = require('ramda')

const MOCK_DATA = {
  boards: {
    0: { name: 'Winds' },
    1: { name: 'Anchors' }, 
    2: { name: 'Action Items' }
  },
  notes: {
    1: {
      pos: { x: 100, y: 100 }, 
      label: 'Unidirectional Dataflow!', 
      id: '1'
    }
  },
}

const INITIAL_NOTE_POS = {
  x: 115, 
  y: 425
}

const getNextNoteId = R.pipe(
  R.values,
  R.map(note => note.id),
  R.sortBy(id => id),
  R.last,
  (id) => (parseInt(id, 10) + 1).toString()
)

module.exports.controller = (io) => {
  let state = R.merge({}, MOCK_DATA);
  
  const applyUpdate = (socket, updater) => {
    state = updater(state)
    console.log('state-update', state)
    io.sockets.emit('state-update', state)
  }
  
  return (socket) => {
    socket.on('init', (data) => {
      socket.emit('bootstrap', state)
    })
    
    socket.on('move-note', ({ id, x, y }) => {
      const update = R.set(
        R.lensPath(['notes', id, 'pos']), 
        { x, y }
      );
      applyUpdate(socket, update)
    })
    
    socket.on('add-note', () => {
      const newId = getNextNoteId(state.notes)
    
      const update = R.set(
        R.lensPath(['notes', newId]),
        { id: newId, pos: INITIAL_NOTE_POS, label: '' }
      )
      
      applyUpdate(socket, update)
    })
    
    socket.on('change-note-label', ({ id, label }) => {
      const update = R.set(
        R.lensPath(['notes', id, 'label']),
        label
      )
      
      applyUpdate(socket, update)
    })
  }
}
