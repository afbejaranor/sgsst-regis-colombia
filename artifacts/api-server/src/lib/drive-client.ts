import { ReplitConnectors } from "@replit/connectors-sdk";
import { logger } from "./logger";

// Google Drive integration via Replit Connectors
// Connection: conn_google-drive_01KR0B8Q3K53EFPYB35TW4QRHB
const connectors = new ReplitConnectors();

type DriveFile = { id: string; name?: string; webViewLink?: string };
type DriveFileList = { files: DriveFile[] };

const folderCache = new Map<string, string>();

async function driveGet<T>(path: string): Promise<T> {
  const res = await connectors.proxy("google-drive", path, { method: "GET" });
  return res.json() as Promise<T>;
}

async function drivePost<T>(path: string, body: unknown, contentType = "application/json"): Promise<T> {
  const res = await connectors.proxy("google-drive", path, {
    method: "POST",
    headers: { "Content-Type": contentType },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
  return res.json() as Promise<T>;
}

async function findFolder(name: string, parentId?: string): Promise<string | null> {
  const q = parentId
    ? `name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false and '${parentId}' in parents`
    : `name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  const result = await driveGet<DriveFileList>(
    `/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name)`,
  );
  return result.files?.[0]?.id ?? null;
}

async function createFolder(name: string, parentId?: string): Promise<string> {
  const body: Record<string, unknown> = {
    name,
    mimeType: "application/vnd.google-apps.folder",
  };
  if (parentId) body.parents = [parentId];
  const result = await drivePost<DriveFile>("/drive/v3/files", body);
  return result.id;
}

async function getOrCreateFolder(name: string, parentId?: string): Promise<string> {
  const key = `${parentId ?? "root"}|${name}`;
  if (folderCache.has(key)) return folderCache.get(key)!;
  let id = await findFolder(name, parentId);
  if (!id) id = await createFolder(name, parentId);
  folderCache.set(key, id);
  return id;
}

export async function getEmpresaModuloFolder(empresaNombre: string, modulo: string): Promise<string> {
  const rootId = await getOrCreateFolder("SG-SST Regis");
  const empresaId = await getOrCreateFolder(empresaNombre, rootId);
  return getOrCreateFolder(modulo, empresaId);
}

export async function uploadFileToDrive(
  fileName: string,
  content: Buffer,
  mimeType: string,
  parentFolderId: string,
): Promise<{ id: string; webViewLink: string }> {
  const metadata = JSON.stringify({ name: fileName, parents: [parentFolderId] });
  const boundary = "sgsst_mp_boundary";

  const header = Buffer.from(
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`,
  );
  const footer = Buffer.from(`\r\n--${boundary}--`);
  const bodyBuffer = Buffer.concat([header, content, footer]);

  const uploadRes = await connectors.proxy(
    "google-drive",
    "/upload/drive/v3/files?uploadType=multipart&fields=id",
    {
      method: "POST",
      headers: { "Content-Type": `multipart/related; boundary=${boundary}` },
      body: bodyBuffer as unknown as ArrayBuffer,
    },
  );
  const uploaded = (await uploadRes.json()) as DriveFile;

  const fileInfo = await driveGet<DriveFile>(`/drive/v3/files/${uploaded.id}?fields=id,webViewLink`);
  return { id: fileInfo.id, webViewLink: fileInfo.webViewLink ?? "" };
}

export async function uploadToEmpresaFolder(
  empresaNombre: string,
  modulo: string,
  fileName: string,
  content: Buffer,
  mimeType: string,
): Promise<string | null> {
  try {
    const folderId = await getEmpresaModuloFolder(empresaNombre, modulo);
    const { webViewLink } = await uploadFileToDrive(fileName, content, mimeType, folderId);
    return webViewLink;
  } catch (err) {
    logger.error({ err }, "Drive upload failed - continuing without Drive link");
    return null;
  }
}
