const { WebClient } = require('@slack/web-api')

export class SlackApi {
  constructor(token) {
    this.token = token
    this.web = new WebClient(token)
  }

  async postMessage(channelName, message) {
    await this.web.chat.postMessage({
      text: message,
      channel: channelName,
    })
  }
}
