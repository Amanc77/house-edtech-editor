import { documentController } from "@/server/controllers/document.controller";

type Params = { params: Promise<{ documentId: string }> };

export async function POST(req: Request, { params }: Params) {
  const { documentId } = await params;
  return documentController.archive(req, { documentId });
}
