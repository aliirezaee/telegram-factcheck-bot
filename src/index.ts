export interface Env {
	AI: Ai;
	TELEGRAM_BOT_TOKEN: string;
	TAVILY_API_KEY: string;
	TELEGRAM_WEBHOOK_SECRET: string;
	BOT_USERNAME: string;
	ALLOWED_CHAT_IDS: string;
  }
  
  const MODEL = "@cf/meta/llama-3.1-8b-instruct-fast";
  
  const DOMAINS = [
	"reuters.com",
	"apnews.com",
	"bbc.com",
	"theguardian.com",
	"nytimes.com",
	"washingtonpost.com",
	"aljazeera.com",
	"dw.com",
	"france24.com",
	"euronews.com",
	"factcheck.org",
	"snopes.com",
	"politifact.com",
	"afp.com",
	"iranwire.com",
	"radiofarda.com",
	"iranintl.com",
	"entekhab.ir",
	"fararu.com",
	"isna.ir",
	"irna.ir",
	"mehrnews.com",
	"tasnimnews.com",
	"farsnews.ir",
	"x.com",
  ];
  
  type TelegramUpdate = {
	message?: {
	  message_id: number;
	  chat: {
		id: number | string;
		type: string;
	  };
	  text?: string;
	};
  };
  
  export default {
	async fetch(request: Request, env: Env): Promise<Response> {
	  try {
		if (request.method !== "POST") {
		  return new Response("OK");
		}
  
		const secret = request.headers.get(
		  "X-Telegram-Bot-Api-Secret-Token"
		);
  
		if (!secret || secret !== env.TELEGRAM_WEBHOOK_SECRET) {
		  return new Response("Unauthorized", { status: 401 });
		}
  
		const update = (await request.json()) as TelegramUpdate;
		const msg = update.message;
  
		if (!msg?.text) {
		  return new Response("OK");
		}
  
		const chatId = String(msg.chat.id);
  
		const allowedChats = env.ALLOWED_CHAT_IDS
		  .split(",")
		  .map((x) => x.trim())
		  .filter(Boolean);
  
		const text = msg.text.trim();
  
		const botMention = env.BOT_USERNAME
		  ? `@${env.BOT_USERNAME}`
		  : "";
  
		const checkPrefix = botMention
		  ? `/check${botMention}`
		  : "/check";
  
		const isCheck =
		  text === "/check" ||
		  text.startsWith("/check ") ||
		  text === checkPrefix ||
		  text.startsWith(`${checkPrefix} `);
  
		if (!isCheck) {
		  return new Response("OK");
		}
  
		const rawClaim = text
		  .replace(/^\/check(@[A-Za-z0-9_]+)?/i, "")
		  .trim();
  
		if (
		  rawClaim.toLowerCase() === "chatid" ||
		  rawClaim === "**chatid**"
		) {
		  await sendTelegram(
			env,
			chatId,
			`chat_id: ${chatId}`
		  );
  
		  return new Response("OK");
		}
  
		if (!allowedChats.includes(chatId)) {
		  await sendTelegram(
			env,
			chatId,
			"این گروه در allow-list نیست."
		  );
  
		  return new Response("OK");
		}
  
		const claim = sanitize(rawClaim);
  
		if (!claim || claim.length < 5) {
		  await sendTelegram(
			env,
			chatId,
			"بعد از /check متن خبر یا ادعا را بنویس."
		  );
  
		  return new Response("OK");
		}
  
		const searchResults = await tavilySearch(env, claim);
  
		const answer = await factCheck(
		  env,
		  claim,
		  searchResults
		);
  
		await sendTelegram(env, chatId, answer);
  
		return new Response("OK");
	  } catch {
		return new Response("OK");
	  }
	},
  } satisfies ExportedHandler<Env>;
  
  function sanitize(input: string): string {
	return input
	  .replace(
		/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
		"[email]"
	  )
	  .replace(/\+?\d[\d\s().-]{7,}\d/g, "[phone]")
	  .replace(/@\w{3,}/g, "[username]")
	  .slice(0, 1200);
  }
  
  async function tavilySearch(env: Env, claim: string) {
	const response = await fetch(
	  "https://api.tavily.com/search",
	  {
		method: "POST",
		headers: {
		  "Content-Type": "application/json",
		  Authorization: `Bearer ${env.TAVILY_API_KEY}`,
		},
		body: JSON.stringify({
		  query: claim,
		  search_depth: "basic",
		  include_answer: false,
		  include_raw_content: false,
		  max_results: 6,
		  include_domains: DOMAINS,
		}),
	  }
	);
  
	if (!response.ok) {
	  return [];
	}
  
	const data = (await response.json()) as {
	  results?: Array<{
		title?: string;
		url?: string;
		content?: string;
	  }>;
	};
  
	return (data.results ?? []).map((r) => ({
	  title: r.title ?? "",
	  url: r.url ?? "",
	  content: r.content ?? "",
	}));
  }
  
  async function factCheck(
	env: Env,
	claim: string,
	results: Array<{
	  title: string;
	  url: string;
	  content: string;
	}>
  ) {
	if (!results.length) {
	  return [
		"نتیجه: تأییدنشده",
		"خلاصه: منبع معتبری پیدا نشد.",
		"شایعه از: نامشخص",
		"منابع: ندارد",
	  ].join("\n");
	}
  
	const sources = results
	  .slice(0, 6)
	  .map(
		(r, i) =>
		  `[${i + 1}]
  عنوان: ${r.title}
  لینک: ${r.url}
  خلاصه: ${r.content}`
	  )
	  .join("\n\n");
  
	const messages = [
	  {
		role: "system",
		content: `You are a strict fact-checking assistant.
  
  Answer in Persian.
  Keep answers very short.
  
  Rules:
  - Use ONLY provided sources.
  - Never invent facts.
  - If no direct reliable source confirms the claim, result must be "تأییدنشده".
  - Mention source names or links briefly.
  - If the claim seems to be a rumor, mention which source/post spread it if visible.
  - Never write long explanations.
  - Maximum 5 short lines.
  - Verdict must be exactly one of:
  درست
  نادرست
  گمراه‌کننده
  تأییدنشده
  نیازمند زمینه بیشتر
  
  Format:
  نتیجه: ...
  خلاصه: ...
  شایعه از: ...
  منابع:
  - source/link`,
	  },
	  {
		role: "user",
		content: `ادعا:
  ${claim}
  
  منابع:
  ${sources}`,
	  },
	];
  
	const aiResponse = (await env.AI.run(MODEL, {
	  messages,
	  temperature: 0.1,
	  max_tokens: 350,
	})) as {
	  response?: string;
	  result?: {
		response?: string;
	  };
	};
  
	return trimTelegram(
	  aiResponse.response ??
		aiResponse.result?.response ??
		"نتیجه: تأییدنشده"
	);
  }
  
  async function sendTelegram(
	env: Env,
	chatId: string,
	text: string
  ) {
	await fetch(
	  `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
	  {
		method: "POST",
		headers: {
		  "Content-Type": "application/json",
		},
		body: JSON.stringify({
		  chat_id: chatId,
		  text: trimTelegram(text),
		  disable_web_page_preview: true,
		}),
	  }
	);
  }
  
  function trimTelegram(text: string): string {
	return text.length > 3900
	  ? text.slice(0, 3900) + "\n…"
	  : text;
  }