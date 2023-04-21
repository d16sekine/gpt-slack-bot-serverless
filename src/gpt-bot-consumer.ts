import { SQSEvent } from 'aws-lambda'
import { SlackApi } from './utility/SlackApi'
import { GptChatHistory, Message } from './utility/GptChatHistory'

const { Configuration, OpenAIApi } = require('openai')

module.exports.handler = async (event: SQSEvent) => {
  console.log('event:', event)

  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  })

  const slackApi = new SlackApi(process.env.SLACK_BOT_TOKEN)
  const openai = new OpenAIApi(configuration)
  const gptChatHistory = new GptChatHistory()

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

    const requestMessages = systemMessage.concat(dbMessages)
    requestMessages.push({ role: 'user', content: body.message })

    const response = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: requestMessages,
      temperature: 0,
    })

    const messageHistory: Message[] = [
      { role: 'user', content: body.message },
      {
        role: 'assistant',
        content: response.data.choices[0].message.content,
      },
    ]

    await slackApi.postMessage(body.channelId, response.data.choices[0].message.content)
    await gptChatHistory.pushMessages(body.channelId, messageHistory)

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
      const slackApi = new SlackApi(process.env.SLACK_BOT_TOKEN)

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
      const slackApi = new SlackApi(process.env.SLACK_BOT_TOKEN)

      clearInterval(intervalId)
      await slackApi.postMessage(channelId, 'すみません、時間切れです。')
    } catch (error) {
      console.error(error)
      throw error
    }
  }, seconds * 1000)
  return timerId
}
