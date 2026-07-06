import { aiController } from "@/server/controllers/ai.controller";

export async function POST(req: Request) {
  return aiController.processBatch(req);
}
