import { compressImage, isImage } from "@/lib/image-compress";

const CLOUDINARY_CLOUD_NAME = "dx4dgjuib";
const CLOUDINARY_UPLOAD_PRESET = "gloja-anexos";

export type MediaTipo = "image" | "pdf" | "video" | "other";

export function detectMediaTipo(file: File): MediaTipo {
  if (isImage(file)) return "image";
  if (file.type === "application/pdf") return "pdf";
  if (file.type.startsWith("video/")) return "video";
  return "other";
}

/**
 * Upload para Cloudinary. Imagens são comprimidas no cliente
 * (lição do gestão stock: nunca empurrar blob pesado cru no caminho crítico).
 */
export async function uploadMedia(
  file: File,
  folder = "gloja-trabalhos"
): Promise<{ url: string; tipo: MediaTipo }> {
  const tipo = detectMediaTipo(file);
  const blob = tipo === "image" ? await compressImage(file) : file;

  const fd = new FormData();
  fd.append("file", blob, file.name);
  fd.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  fd.append("folder", folder);

  const resource = tipo === "image" ? "image" : tipo === "pdf" || tipo === "other" ? "raw" : "auto";
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resource}/upload`,
    { method: "POST", body: fd }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Upload falhou: ${err}`);
  }

  const data = await res.json();
  return { url: data.secure_url as string, tipo };
}
