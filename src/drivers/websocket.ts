import io = require('socket.io-client')

export function createWebsocketDriver(url: string) {
  const socket = io.connect(url)
  
  return (emit$) => {
    
  }
}