import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb'
import { GptToken } from './GptToken'
import dayjs from 'dayjs'

export type Message = {
  role: string
  content: string
}

export class GptChatHistory {
  ddbDocClient: any
  constructor() {
    const ddbClient = new DynamoDBClient({})
    this.ddbDocClient = DynamoDBDocumentClient.from(ddbClient)
  }

  async getMessages(channelId: string): Promise<Message[]> {
    const params = {
      TableName: 'gptChatHistory',
      Key: {
        channelId: channelId,
      },
    }
    const data = await this.ddbDocClient.send(new GetCommand(params))

    let res: Message[]

    if (data.Item) res = data.Item.messages
    else res = []

    return res
  }
  async putMessages(channelId: string, messages: Message[]): Promise<string> {
    const gptToken = new GptToken()
    const estimatedTokens = gptToken.countTokens(messages)

    const params = {
      TableName: 'gptChatHistory',
      Item: {
        channelId: channelId,
        messages: messages,
        estimatedTokens: estimatedTokens,
        datetimeAt: dayjs().format(),
      },
    }
    await this.ddbDocClient.send(new PutCommand(params))
    return 'success'
  }
  async pushMessages(channelId: string, messages: Message[]): Promise<string> {
    const dbMessages = await this.getMessages(channelId)
    const mergedMessages = dbMessages.concat(messages)

    await this.putMessages(channelId, mergedMessages)
    return 'success'
  }
}
