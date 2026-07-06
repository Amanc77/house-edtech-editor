import { documentController } from "@/server/controllers/document.controller";

type Params = { params: Promise<{ documentId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { documentId } = await params;
  return documentController.getById(_req, { documentId });
}

export async function PATCH(req: Request, { params }: Params) {
  const { documentId } = await params;
  return documentController.update(req, { documentId });
}

export async function DELETE(req: Request, { params }: Params) {
  const { documentId } = await params;
  return documentController.delete(req, { documentId });
}
