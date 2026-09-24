export type ModelMessage = { role: 'system' | 'user' | 'assistant'; content: string }

export async function generateWithProvider(messages: ModelMessage[]): Promise<string | null> {
  const baseUrl = process.env.LLM_BASE_URL
  const apiKey = process.env.LLM_API_KEY
  const model = process.env.LLM_MODEL
  if (!baseUrl || !model) return null

  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify({ model, messages, temperature: 0.2 }),
  })

  if (!response.ok) throw new Error(`LLM provider returned ${response.status}`)
  const data = await response.json() as any
  return data?.choices?.[0]?.message?.content ?? null
}
