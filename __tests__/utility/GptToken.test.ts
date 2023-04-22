import { GptToken } from '../../src/utility/GptToken'
import { Message } from '../../src/utility/GptChatHistory'

const testMessages: Message[] = [
  { role: 'system', content: 'You are an AI assistant that helps people find information.' },
  { role: 'user', content: 'This is sample.' },
]

describe('GptTokens', () => {
  test('count tokens', async () => {
    const gptToken = new GptToken()
    const result = gptToken.countTokens(testMessages)
    expect(result).toBe(28)
  })
  test('reduce messages', async () => {
    const expectedValue = testMessages.length - 1
    const gptToken = new GptToken()
    const tokenNumber = gptToken.countTokens(testMessages)
    const result = gptToken.reduceMessages(testMessages, tokenNumber - 1)
    expect(result.length).toBe(expectedValue)
  })
})
