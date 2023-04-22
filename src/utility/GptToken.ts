import { get_encoding, Tiktoken } from '@dqbd/tiktoken'
import { Message } from './GptChatHistory'

export class GptToken {
  enc: Tiktoken
  constructor() {
    this.enc = get_encoding('cl100k_base')
  }

  countTokens(messages: Message[]): number {
    const messageArray = messages.map((item) => {
      return JSON.stringify(item)
    })

    const messageText = messageArray.join('').replace(/{|}/g, '')
    const result = this.enc.encode(messageText)

    return result.length
  }

  reduceMessages(messages: Message[], maxToken: number): Message[] {
    while (this.countTokens(messages) > maxToken) {
      messages.shift()
    }
    return messages
  }
}
