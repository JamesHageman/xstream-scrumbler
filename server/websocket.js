
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

module.exports.controller = (io) => (socket) => {
  socket.on('init', (data) => {
    socket.emit('bootstrap', MOCK_DATA)
  })
}
