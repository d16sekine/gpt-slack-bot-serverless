import { Context, APIGatewayProxyCallback, APIGatewayEvent } from 'aws-lambda'
import { App, AwsLambdaReceiver } from '@slack/bolt'
import { sendSqs } from './utility/sqs'

const secret: string = process.env.SLACK_SIGNING_SECRET || ''

const awsLambdaReceiver = new AwsLambdaReceiver({ signingSecret: secret })
// initialize slack app
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  receiver: awsLambdaReceiver,
})

app.message(async ({ message, say }) => {
  // @ts-ignore
  if (!message.text) return
  try {
    const body = {
      channelId: message.channel,
      // @ts-ignore
      message: message.text,
    }

    await sendSqs(body)
    await say('ちょっとお待ちください。')
  } catch (e) {
    console.log(e)
    await say('何か不具合が発生しているかもしれません。')
    throw e
  }
})

module.exports.handler = async (event: APIGatewayEvent, context: Context, callback: APIGatewayProxyCallback) => {
  // retry check
  if (event.headers['x-slack-retry-num'] || event.headers['X-Slack-Retry-Num']) {
    console.log('No need to resend')
    return { statusCode: 200, body: JSON.stringify({ message: 'No need to resend' }) }
  }

  const handler = await awsLambdaReceiver.start()
  return handler(event, context, callback)
}
