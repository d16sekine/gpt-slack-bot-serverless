import { SQSClient, SQSClientConfig } from '@aws-sdk/client-sqs'
import { SendMessageCommand, ReceiveMessageCommand, DeleteMessageCommand } from '@aws-sdk/client-sqs'
import { fromIni } from '@aws-sdk/credential-providers'
const dayjs = require('dayjs')
import * as dotenv from 'dotenv'
dotenv.config()

type sqsBody = {
  channelId: string
  message: string
}

export async function sendSqs(body: sqsBody) {
  let sqsClient
  if (process.env.AWS_EXECUTION_ENV) {
    const config: SQSClientConfig = { region: process.env.AWS_REGION }
    sqsClient = new SQSClient(config)
  } else {
    // for local test
    const config: SQSClientConfig = {
      credentials: fromIni({ profile: process.env.AWS_PROFILE_NAME }),
      region: 'ap-northeast-1',
    }
    sqsClient = new SQSClient(config)
  }

  const params = {
    QueueUrl: process.env.SQS_URL,
    MessageBody: JSON.stringify(body),
    MessageGroupId: dayjs().format('HH:mm:ss'),
    MessageDeduplicationId: dayjs().format('HH:mm:ss'),
  }

  await sqsClient.send(new SendMessageCommand(params))
}

export async function receiveSqs() {
  let sqsClient
  if (process.env.AWS_EXECUTION_ENV) {
    const config: SQSClientConfig = { region: process.env.AWS_REGION }
    sqsClient = new SQSClient(config)
  } else {
    const config: SQSClientConfig = {
      credentials: fromIni({ profile: process.env.AWS_PROFILE }),
      region: 'ap-northeast-1',
    }
    sqsClient = new SQSClient(config)
  }

  const params = {
    AttributeNames: ['All'],
    MaxNumberOfMessages: 10,
    MessageAttributeNames: ['All'],
    QueueUrl: process.env.SQS_URL,
    VisibilityTimeout: 20,
    WaitTimeSeconds: 0,
  }
  try {
    const data = await sqsClient.send(new ReceiveMessageCommand(params))
    if (data.Messages) {
      const deleteParams = {
        QueueUrl: process.env.SQS_URL,
        ReceiptHandle: data.Messages[0].ReceiptHandle,
      }
      try {
        const data = await sqsClient.send(new DeleteMessageCommand(deleteParams))
        console.log('Message deleted', data)
      } catch (err) {
        console.log('Error', err)
      }
    } else {
      console.log('No messages to delete')
    }
    return data // For unit tests.
  } catch (err) {
    console.log('Receive Error', err)
  }
}
