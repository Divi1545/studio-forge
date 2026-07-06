import Anthropic from "@anthropic-ai/sdk";

const DEFAULT_MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (client) return client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("Missing required env var: ANTHROPIC_API_KEY");
  }
  client = new Anthropic({ apiKey });
  return client;
}

export interface CompleteOptions {
  system?: string;
  maxTokens?: number;
  temperature?: number;
}

function firstTextBlock(content: Anthropic.Messages.ContentBlock[]): string {
  const block = content.find((b) => b.type === "text");
  return block?.type === "text" ? block.text : "";
}

export async function complete(prompt: string, options: CompleteOptions = {}): Promise<string> {
  const response = await getClient().messages.create({
    model: DEFAULT_MODEL,
    max_tokens: options.maxTokens ?? 4096,
    temperature: options.temperature,
    system: options.system,
    messages: [{ role: "user", content: prompt }],
  });
  return firstTextBlock(response.content);
}

function stripMarkdownFences(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json)?\n?/, "")
    .replace(/\n?```$/, "");
}

export async function completeJSON<T = unknown>(
  prompt: string,
  options: CompleteOptions = {},
): Promise<T> {
  const raw = await complete(prompt, options);
  try {
    return JSON.parse(stripMarkdownFences(raw)) as T;
  } catch {
    const retryPrompt = `${prompt}\n\nYour previous response could not be parsed as JSON:\n${raw}\n\nRespond again with ONLY valid JSON, no markdown fences, no commentary.`;
    const retryRaw = await complete(retryPrompt, options);
    return JSON.parse(stripMarkdownFences(retryRaw)) as T;
  }
}

export async function analyzeImage(
  imageUrl: string,
  prompt: string,
  options: CompleteOptions = {},
): Promise<string> {
  const response = await getClient().messages.create({
    model: DEFAULT_MODEL,
    max_tokens: options.maxTokens ?? 2048,
    temperature: options.temperature,
    system: options.system,
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "url", url: imageUrl } },
          { type: "text", text: prompt },
        ],
      },
    ],
  });
  return firstTextBlock(response.content);
}
