# Telegram Fact-Check Bot

Privacy-friendly Telegram fact-check bot powered by Cloudflare Workers AI.

Default output language: Persian (Farsi).
The response language can be changed easily from the system prompt.

## Features

* Privacy-friendly architecture
* Works with Telegram Privacy Mode
* Only responds to `/check`
* No database
* No message storage
* No OpenAI API required
* Runs fully on Cloudflare Workers
* Uses Cloudflare Workers AI
* Tavily-powered web search
* Supports trusted international and Persian news sources
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

## Supported Sources

### International Sources

* Reuters
* AP News
* BBC
* The Guardian
* New York Times
* Washington Post
* Al Jazeera
* DW
* AFP
* France24
* Euronews
* FactCheck.org
* Snopes
* PolitiFact
* X (Twitter)

### Persian Sources

* Iran International
* IranWire
* Radio Farda
* ISNA
* IRNA
* Fararu
* Entekhab
* Mehr News
* Tasnim
* Fars News

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

### Install Dependencies

```bash
npm install
```

---

## Configure Wrangler

Edit:

```text
wrangler.jsonc
```

Example:

```jsonc
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "telegram-factcheck-bot",
  "main": "src/index.ts",
  "compatibility_date": "2026-05-10",
  "ai": {
    "binding": "AI"
  }
}
```

---

## Add Cloudflare Secrets

```bash
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put TAVILY_API_KEY
npx wrangler secret put TELEGRAM_WEBHOOK_SECRET
npx wrangler secret put BOT_USERNAME
npx wrangler secret put ALLOWED_CHAT_IDS
```

Generate webhook secret:

```bash
openssl rand -hex 32
```

---

## Deploy

```bash
npx wrangler deploy
```

---

## Set Telegram Webhook

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

## Language

The bot currently replies in Persian (Farsi) by default.

Supported output languages are configurable through the system prompt.

Examples:

* Persian (default)
* English
* Arabic
* Turkish
* French
* German
* Any language supported by the model

To change the output language, edit the system prompt in:

```text
src/index.ts
```

Find:

```ts
Answer in Persian.
```

Replace with:

```ts
Answer in English.
```

Or any other language instruction.

## Security Notes

Do NOT expose:

* Telegram bot token
* Tavily API key
* Webhook secret
* Real group chat IDs
* `.env` files
* `.dev.vars`

Recommended:

* Store secrets only in Cloudflare Secrets
* Keep local secrets in `.dev.vars`
* Never commit real credentials to GitHub

## Recommended Repository Settings

Enable:

* Secret scanning
* Push protection
* Dependabot alerts
* Dependency graph
* CodeQL analysis

Recommended branch protection:

* Protect `main`
* Restrict direct pushes
* Allow only repository owner pushes

## License

MIT
