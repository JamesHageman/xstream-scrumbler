import { Stream, Producer } from 'xstream'
import io = require('socket.io-client')

export interface EmitMessage {
  type: string
  data?: any
}

interface IncomingMessage {
  type: string
  data: any
}

export interface WebsocketSource {
  get: (type: string) => Stream<IncomingMessage>
}

const getMessageStream = (type: string, socket: SocketIOClient.Socket)
  : Stream<IncomingMessage> => {
    
  const producer : Producer<IncomingMessage> = {
    start(listener) {
      socket.on(type, (data) => {
        listener.next({
          type,
          data
        } as IncomingMessage)
      })
    },
    stop() {
      
    }
  }
  return Stream.create(producer)
}

export function createWebsocketDriver(url: string) {
  const socket = io.connect(url)
  
  return (emit$: Stream<EmitMessage>) : WebsocketSource => {
    emit$.addListener({
      next: (emitMessage) => {
        socket.emit(emitMessage.type, emitMessage.data)
      },
      error: (err) => console.error(err),
      complete: () => {}
    })
    
    return {
      get: (type: string) => getMessageStream(type, socket)
    }
  }
}
