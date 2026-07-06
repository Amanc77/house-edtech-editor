import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { connectDB } from "@/server/db/connection";
import { activityRepository } from "@/server/repositories/activity.repository";
import { documentRepository } from "@/server/repositories/document.repository";
import { permissionService } from "@/server/services/permission.service";
import { sanitizePlainText, stripHtml } from "@/lib/security";
import type { AIRequest, AIResponse, AIFeature } from "@/types";

export class AIServiceError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = "AIServiceError";
  }
}

const FEATURE_PROMPTS: Record<AIFeature, (content: string, opts?: { language?: string; tone?: string }) => string> = {
  summarize: (content) =>
    `Summarize the following text concisely in 2-3 paragraphs:\n\n${content}`,
  improve: (content, opts) =>
    `Improve the writing quality of the following text${opts?.tone ? ` with a ${opts.tone} tone` : ""}. Return only the improved text:\n\n${content}`,
  grammar: (content) =>
    `Fix all grammar and spelling errors in the following text. Return only the corrected text:\n\n${content}`,
  rewrite: (content, opts) =>
    `Rewrite the following text${opts?.tone ? ` in a ${opts.tone} tone` : ""}. Return only the rewritten text:\n\n${content}`,
  translate: (content, opts) =>
    `Translate the following text to ${opts?.language ?? "English"}. Return only the translation:\n\n${content}`,
  title: (content) =>
    `Generate a concise, descriptive title (max 10 words) for the following content. Return only the title:\n\n${content}`,
  "action-items": (content) =>
    `Extract action items from the following text as a bulleted list:\n\n${content}`,
  explain: (content) =>
    `Explain the following text in simple terms:\n\n${content}`,
  continue: (content) =>
    `Continue writing naturally from where this text ends. Return only the continuation:\n\n${content}`,
};

function getModel() {
  if (process.env.OPENAI_API_KEY) {
    const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
    return openai("gpt-4o-mini");
  }

  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    const google = createGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    });
    return google("gemini-2.0-flash");
  }

  throw new AIServiceError(
    "No AI provider configured. Set OPENAI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY",
    503
  );
}

export const aiService = {
  async process(userId: string, request: AIRequest): Promise<AIResponse> {
    await connectDB();

    if (request.documentId) {
      const document = await documentRepository.findById(request.documentId);
      if (!document) {
        throw new AIServiceError("Document not found", 404);
      }
      await permissionService.requireRead(
        request.documentId,
        userId,
        document.ownerId
      );
    }

    const plainContent = sanitizePlainText(stripHtml(request.content));
    if (!plainContent) {
      throw new AIServiceError("Content is empty after sanitization", 400);
    }

    const promptFn = FEATURE_PROMPTS[request.feature];
    const prompt = promptFn(plainContent, {
      language: request.language,
      tone: request.tone,
    });

    const model = getModel();

    const { text, usage } = await generateText({
      model,
      prompt,
      maxOutputTokens: 2048,
    });

    const result = sanitizePlainText(text);

    if (request.documentId) {
      await activityRepository.create({
        documentId: request.documentId,
        userId,
        action: `ai.${request.feature}`,
        metadata: { tokensUsed: usage?.totalTokens },
      });
    }

    return {
      feature: request.feature,
      result,
      tokensUsed: usage?.totalTokens,
    };
  },

  async processBatch(
    userId: string,
    requests: AIRequest[]
  ): Promise<AIResponse[]> {
    const results: AIResponse[] = [];
    for (const request of requests) {
      const result = await this.process(userId, request);
      results.push(result);
    }
    return results;
  },
};
