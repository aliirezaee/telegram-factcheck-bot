# Telegram Fact-Check Bot

Privacy-friendly Telegram fact-check bot using Cloudflare Workers AI.

## Features

* Privacy-friendly architecture
* Telegram Privacy Mode compatible
* Only responds to `/check`
* No database
* No message storage
* No OpenAI API
* Runs fully on Cloudflare Workers
* Uses Cloudflare Workers AI
* Tavily-powered search
* Searches trusted news sources
* Lightweight and low-cost

## Architecture

```text
Telegram Group
→ Telegram Webhook
→ Cloudflare Worker
→ Cloudflare Workers AI
→ Tavily Search API
→ Response in Group
```

## AI Model

```text
@cf/meta/llama-3.1-8b-instruct-fast
```

## Search Sources

* Reuters
* AP News
* BBC
* Al Jazeera
* DW
* AFP
* France24
* Euronews
* X (Twitter)
* Selected Persian news websites
* Fact-checking websites

## Privacy & Security

* Telegram Privacy Mode enabled
* Only `/check` commands are processed
* No public MessageHandler
* No database or KV storage
* No Durable Objects
* Webhook secret verification
* Sensitive data sanitization:

  * usernames
  * emails
  * phone numbers
* No message logging
* Group allow-list support

## Setup

### Install

```bash
npm install
```

### Configure `wrangler.jsonc`

```jsonc
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "telegram-factcheck-bot",
  "main": "src/index.ts",
  "compatibility_date": "2026-05-10",
  "ai": {
    "binding": "AI"
  },
  "vars": {
    "BOT_USERNAME": "YourBotUsernameWithoutAt",
    "ALLOWED_CHAT_IDS": ""
  }
}
```

### Add Secrets

```bash
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put TAVILY_API_KEY
npx wrangler secret put TELEGRAM_WEBHOOK_SECRET
```

Generate webhook secret:

```bash
openssl rand -hex 32
```

### Deploy

```bash
npx wrangler deploy
```

### Set Telegram Webhook

```bash
curl -X POST "https://api.telegram.org/bot$BOT_TOKEN/setWebhook" \
-H "Content-Type: application/json" \
-d "{
  \"url\": \"$WORKER_URL\",
  \"secret_token\": \"$WEBHOOK_SECRET\",
  \"allowed_updates\": [\"message\"],
  \"drop_pending_updates\": true
}"
```

## Usage

```text
/check your claim here
```

Example:

```text
/check Is this news real?
```

## Before Publishing to GitHub

Remove or avoid exposing:

* Telegram bot token
* Tavily API key
* Webhook secret
* Real group chat IDs
* Any `.env` files
* Any local logs

Safe to keep public:

* `src/index.ts`
* `wrangler.jsonc`
* `README.md`
* `package.json`
* `.gitignore`

### Important

Do NOT commit real values like:

```jsonc
"ALLOWED_CHAT_IDS": "-100xxxxxxxxxx"
```

Instead use:

```jsonc
"ALLOWED_CHAT_IDS": ""
```

Also replace:

```jsonc
"BOT_USERNAME": "YourRealBotName"
```

with:

```jsonc
"BOT_USERNAME": "YourBotUsernameWithoutAt"
```

## License

MIT
