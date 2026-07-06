import { documentController } from "@/server/controllers/document.controller";

export async function GET(req: Request) {
  return documentController.list(req);
}

export async function POST(req: Request) {
  return documentController.create(req);
}
