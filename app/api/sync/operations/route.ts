import { syncController } from "@/server/controllers/sync.controller";

export async function GET(req: Request) {
  return syncController.fetchOperations(req);
}
