import { versionController } from "@/server/controllers/version.controller";

type Params = { params: Promise<{ documentId: string; versionId: string }> };

export async function GET(req: Request, { params }: Params) {
  const { documentId, versionId } = await params;
  return versionController.getById(req, { documentId, versionId });
}
