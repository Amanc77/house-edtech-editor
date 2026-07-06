import { versionController } from "@/server/controllers/version.controller";

type Params = { params: Promise<{ documentId: string }> };

export async function GET(req: Request, { params }: Params) {
  const { documentId } = await params;
  return versionController.list(req, { documentId });
}

export async function POST(req: Request, { params }: Params) {
  const { documentId } = await params;
  return versionController.create(req, { documentId });
}
