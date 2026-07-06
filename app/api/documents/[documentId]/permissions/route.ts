import { documentController } from "@/server/controllers/document.controller";

type Params = { params: Promise<{ documentId: string }> };

export async function GET(req: Request, { params }: Params) {
  const { documentId } = await params;
  return documentController.listPermissions(req, { documentId });
}
