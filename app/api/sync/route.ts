import { syncController } from "@/server/controllers/sync.controller";

export async function POST(req: Request) {
  return syncController.sync(req);
}
