import { NextRequest } from 'next/server'
import OpenAI from 'openai'

const client = new OpenAI({
  baseURL: 'https://models.github.ai/inference',
  apiKey: process.env.GITHUB_TOKEN ?? '',
})

const SYSTEM_PROMPT = `You are FinanceOS AI, a personal financial advisor specialized in helping H1B visa holders in the United States manage their finances. You have deep knowledge of:
- US tax law (federal + state), FICA, FBAR requirements
- H1B visa constraints: portability, employer sponsorship, green card timelines
- Retirement accounts: 401k, Roth IRA, HSA limits and strategies
- India-US financial considerations: NRE/NRO accounts, remittances, DTAA treaty
- Investment strategies for immigrants with visa uncertainty
- Goal planning, debt payoff strategies (avalanche vs snowball)
- Emergency fund sizing (recommend 12 months for H1B holders vs 6 for citizens)

Be concise, specific, and actionable. Use real numbers when given. Flag any H1B-specific financial risks or opportunities. Never give generic advice when specific advice is possible.`

export async function POST(req: NextRequest) {
  const { messages, context } = await req.json()

  if (!process.env.GITHUB_TOKEN) {
    return new Response('GITHUB_TOKEN not configured. Add it to .env.local', { status: 503 })
  }

  const systemWithContext = context
    ? `${SYSTEM_PROMPT}\n\nCurrent financial context:\n${context}`
    : SYSTEM_PROMPT

  const stream = await client.chat.completions.create({
    model: 'openai/gpt-4o',
    messages: [
      { role: 'system', content: systemWithContext },
      ...messages,
    ],
    stream: true,
    max_tokens: 1024,
    temperature: 0.3,
  })

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content
        if (delta) {
          controller.enqueue(encoder.encode(delta))
        }
      }
      controller.close()
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
