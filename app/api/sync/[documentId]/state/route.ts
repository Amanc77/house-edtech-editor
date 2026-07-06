import { syncController } from "@/server/controllers/sync.controller";

type Params = { params: Promise<{ documentId: string }> };

export async function GET(req: Request, { params }: Params) {
  const { documentId } = await params;
  return syncController.getState(req, { documentId });
}
