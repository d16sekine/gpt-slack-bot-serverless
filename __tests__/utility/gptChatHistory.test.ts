import { GptChatHistory, Message } from '../../src/utility/GptChatHistory'

const testMessages: Message[] = [
  { role: 'system', content: 'You are a helpful assistant.' },
  { role: 'user', content: 'Hello' },
]

describe('gptChatHistory', () => {
  beforeAll(async () => {
    await initialize()
  })

  test('get messages from the channel', async () => {
    const channelId = 'test'
    const gptChatHistory = new GptChatHistory()
    const result = await gptChatHistory.getMessages(channelId)
    expect(result).toEqual(testMessages)
  })
  test('get messages from unknown channel', async () => {
    const channelId = 'unknown'
    const gptChatHistory = new GptChatHistory()
    const result = await gptChatHistory.getMessages(channelId)
    expect(result).toEqual([])
  })
  test('put messages', async () => {
    const channelId = 'test'
    const pushMessage: Message = {
      role: 'assistant',
      content: 'Hello! How can I assist you today?',
    }
    testMessages.push(pushMessage)

    const gptChatHistory = new GptChatHistory()
    const result = await gptChatHistory.putMessages(channelId, testMessages)
    expect(result).toBe('success')
  })
})

const initialize = async () => {
  const channelId = 'test'
  const gptChatHistory = new GptChatHistory()
  await gptChatHistory.putMessages(channelId, testMessages)
}
