import { versionController } from "@/server/controllers/version.controller";

type Params = { params: Promise<{ documentId: string }> };

export async function POST(req: Request, { params }: Params) {
  const { documentId } = await params;
  return versionController.restore(req, { documentId });
}
