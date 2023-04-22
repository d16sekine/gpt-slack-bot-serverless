# gpt-slack-bot-serverless

- OpenAIのAPIと連携するSlackアプリのバックエンド機能をall in oneで提供
- このSlackアプリをインストールしたチャンネルでメッセージを投稿すると、そのメッセージをOpenAIのAPIにリクエストし、その回答を同じチャンネルに投稿

## :mag:Demo

![demo](./docs/slack_demo.gif)

## :rocket:Feature
- チャンネルごとの会話履歴を考慮
- [Serverless Framework](https://www.serverless.com/)を使って1コマンドでAWSにデプロイ


## :triangular_flag_on_post:Sequence Diagram

- Producer API: API Gateway + AWS Lambda
- Consumer API: AWS Lambda
- FIFO queue: AWS SQS
- History DB: AWS DynamoDB

```mermaid
sequenceDiagram
    participant Slack
    participant Producer API
    participant FIFO queue
    participant Consumer API
    participant History DB
    Slack ->> Producer API: request message
    Producer API ->> Slack: instant reply
    Producer API ->> FIFO queue: message
    FIFO queue ->> Consumer API: message
    History DB ->> Consumer API: get messages
    Consumer API ->> OpenAI API: request
    OpenAI API ->> Consumer API: response
    Consumer API ->> Slack: reply message
    Consumer API ->> History DB: push messages
```

## :gear:Requirements

- Node.js v16 or later
- Serverless Framework

```
npm install -g serverless
```

## :technologist:Setup&Usage

Slack Appを新規作成し、下記を取得する。
- Signing Secret
- Bot User OAuth Token

参考：[Bolt 入門ガイド](https://slack.dev/bolt-js/ja-jp/tutorial/getting-started)

本リポジトリをcloneする。
```
git clone https://github.com/d16sekine/gpt-slack-bot-serverless.git
```


下記コマンドで.envファイルを作成し、環境変数を設定する。

```
cp .env_example .env
```

### 環境変数
|name|説明|
|---|---|
|AWS_PROFILE_NAME|deploy時のAWSプロファイルの指定|
|TIMEOUT_SECONDS|AWS LambdaのTimeout時間の値（秒）|
|INTERVAL_SECONDS|APIからのレスポンス待ちのときに、ことわりメッセージをslackに送る時間間隔（秒）|
|SLACK_SIGNING_SECRET|SlackのSigning Secretの値|
|SLACK_BOT_TOKEN|SlackのBot User OAuth Tokenの値|
|OPENAI_API_KEY|OpenAIのAPIキー|
|MAX_PROMPT_TOKEN_NUMBER|Open AIのAPIにpromptを送信する際の最大トークン数。デフォルト：3000|

下記コマンドでAWSにdeployする
```
yarn deploy
```

deployが完了すると、下記のようなendpointが生成される。
```
 https://xxxxxxx.execute-api.ap-northeast-1.amazonaws.com/dev/slack/events  
```

続いて、Slack App側で下記を設定する。
- OAuth & Permissions
  - Scopesで下記を許可
    - channels:history
    - chat:write

![scopes setting](./docs/scopes.png)

- Event Subscriptions
  - Request URLに、deployで作成したendpointを設定
  - Subscribe to bot eventsで下記を許可
    - message.channels

![events setting](./docs/events.png)

本Slack Appと連携したいチャンネルに、本Slack Appをインストールする。

該当チャンネルでメッセージを投稿すると「ちょっとお待ちください」と返答される。
その後、回答が返ってくれば動作確認OK。

![example](./docs/example.jpg)

## :blue_book:Note
- APIからのレスポンスが来ない場合、環境変数INTERVAL_SECONDSで指定した時間間隔で「もう少しお待ちください」というメッセージを投稿
- AWS LambdaがTimeoutする前に、「すみません、時間切れです。」というメッセージを投稿
- OpenAIのモデルは「gpt-3.5-turbo」を利用
## :bulb:License
This project is licensed under the terms of the MIT license.




