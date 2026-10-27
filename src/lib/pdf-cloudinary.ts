/**
 * No plano free do Cloudinary, entrega direta de PDF (raw ou image/pdf)
 * costuma retornar 401 ("Restricted media types").
 * PDFs enviados como resource "image" podem ser lidos página a página.
 */

/** URL de preview de uma página do PDF (PNG). */
export function cloudinaryPdfPageUrl(url: string, page = 1, width = 1400): string | null {
  if (!url.includes("cloudinary.com") || !url.includes("/upload/")) return null;
  // raw não renderiza página — precisa estar em /image/upload/
  if (url.includes("/raw/upload/")) {
    url = url.replace("/raw/upload/", "/image/upload/");
  }
  if (!url.includes("/image/upload/")) return null;
  const transform = `f_png,pg_${Math.max(1, page)},w_${width}`;
  return url.replace("/upload/", `/upload/${transform}/`);
}

export function isCloudinaryPdf(url: string, tipo?: string): boolean {
  if (tipo === "pdf") return true;
  return /\.pdf($|\?)/i.test(url);
}

/** Tenta transformar URL raw → image (só funciona se o asset existir como image). */
export function preferImageDeliveryUrl(url: string): string {
  if (url.includes("/raw/upload/")) {
    return url.replace("/raw/upload/", "/image/upload/");
  }
  return url;
}
