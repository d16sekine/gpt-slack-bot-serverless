import { SQSEvent } from 'aws-lambda'
import { SlackApi } from './utility/SlackApi'
import { GptChatHistory, Message } from './utility/GptChatHistory'
import { GptToken } from './utility/GptToken'
import { ChatOpenAI } from 'langchain/chat_models/openai'
import { HumanChatMessage, AIChatMessage, SystemChatMessage } from 'langchain/schema'

module.exports.handler = async (event: SQSEvent) => {
  console.log('event:', event)

  // const configuration = new Configuration({
  //   apiKey: process.env.OPENAI_API_KEY,
  // })

  const slackApi = new SlackApi(process.env.SLACK_BOT_TOKEN || '')
  const chatModel = new ChatOpenAI({ modelName: 'gpt-3.5-turbo', temperature: 0 })

  const gptChatHistory = new GptChatHistory()
  const gptToken = new GptToken()

  const body = JSON.parse(event.Records[0].body)

  try {
    const intervalId: NodeJS.Timer = intervalMessage(body.channelId, Number(process.env.INTERVAL_SECONDS))
    const timerId: NodeJS.Timeout = timeoutMessage(body.channelId, Number(process.env.TIMEOUT_SECONDS) - 3, intervalId)

    const systemMessage: Message[] = [
      {
        role: 'system',
        content: 'You are an AI assistant that helps people find information.',
      },
    ]
    const dbMessages: Message[] = await gptChatHistory.getMessages(body.channelId)

    const systemTokens: number = gptToken.countTokens(systemMessage)
    const maxDbMessageTokenNumber: number = Number(process.env.MAX_PROMPT_TOKEN_NUMBER) - systemTokens

    const reducedDbMessage: Message[] = gptToken.reduceMessages(dbMessages, maxDbMessageTokenNumber)

    const requestMessages = systemMessage.concat(reducedDbMessage)
    requestMessages.push({ role: 'user', content: body.message })

    console.log(requestMessages)

    const requestChatMessages = requestMessages.map((item) => {
      if (item.role === 'system') return new SystemChatMessage(item.content)
      else if (item.role === 'assistant') return new AIChatMessage(item.content)
      return new HumanChatMessage(item.content)
    })

    const response = await chatModel.call(requestChatMessages)

    const messageHistory: Message[] = [
      { role: 'user', content: body.message },
      {
        role: 'assistant',
        content: response.text,
      },
    ]

    const newDbMessages: Message[] = reducedDbMessage.concat(messageHistory)

    const slackMessage: string = response.text
    await slackApi.postMessage(body.channelId, slackMessage)
    await gptChatHistory.putMessages(body.channelId, newDbMessages)

    clearInterval(intervalId)
    clearTimeout(timerId)
  } catch (error) {
    if (error instanceof Error) {
      console.log(error.message)
      throw error
    }
  }
}

const intervalMessage = (channelId: string, seconds: number): NodeJS.Timer => {
  const intervalId = setInterval(async function () {
    try {
      const slackApi = new SlackApi(process.env.SLACK_BOT_TOKEN || '')

      await slackApi.postMessage(channelId, 'もう少しお待ちください。')
    } catch (error) {
      console.error(error)
      throw error
    }
  }, seconds * 1000)
  return intervalId
}

const timeoutMessage = (channelId: string, seconds: number, intervalId: NodeJS.Timeout) => {
  const timerId = setTimeout(async function () {
    try {
      const slackApi = new SlackApi(process.env.SLACK_BOT_TOKEN || '')

      clearInterval(intervalId)
      await slackApi.postMessage(channelId, 'すみません、時間切れです。')
    } catch (error) {
      console.error(error)
      throw error
    }
  }, seconds * 1000)
  return timerId
}
