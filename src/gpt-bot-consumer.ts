import { SQSEvent } from 'aws-lambda'
import { SlackApi } from './utility/SlackApi'

const { Configuration, OpenAIApi } = require('openai')

module.exports.handler = async (event: SQSEvent) => {
  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  })

  const slackApi = new SlackApi(process.env.SLACK_BOT_TOKEN)
  const openai = new OpenAIApi(configuration)

  const body = JSON.parse(event.Records[0].body)

  intervalMessage(body.channelId, Number(process.env.INTERVAL_SECONDS))

  try {
    const response = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: body.message }],
      temperature: 0,
    })
    await slackApi.postMessage(body.channelId, response.data.choices[0].message.content)
  } catch (error) {
    if (error instanceof Error) {
      console.log(error.message)
      throw error
    }
  }
}

const intervalMessage = (channelId: string, seconds: number) => {
  setInterval(async function () {
    try {
      const slackApi = new SlackApi(process.env.SLACK_BOT_TOKEN)

      await slackApi.postMessage(channelId, 'もう少しお待ちください。')
    } catch (error) {
      console.error(error)
      throw error
    }
  }, seconds * 1000)
}
