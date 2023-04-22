const { WebClient } = require('@slack/web-api')

export class SlackApi {
  token: string
  web: typeof WebClient
  constructor(token: string) {
    this.token = token
    this.web = new WebClient(token)
  }

  async postMessage(channelName: string, message: string) {
    await this.web.chat.postMessage({
      text: message,
      channel: channelName,
    })
  }
}
