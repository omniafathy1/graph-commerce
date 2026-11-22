type CspOptions = {
  isDev: boolean;
  /** false = report-only: مفيش upgrade-insecure-requests (بيتتجاهل هناك) */
  enforce?: boolean;
};

export function buildCsp({ isDev, enforce = false }: CspOptions): string {
  const directives = [
    "default-src 'self'",
    // Next بيحقن inline scripts للـ hydration، ومع Cache Components مينفعش nonce
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
    // inline styles: Next + style={{...}} في صفحة الإحصائيات
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data:",
    "font-src 'self'",
    // ws: للـ HMR في الـ dev بس
    `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ];

  if (enforce && !isDev) directives.push("upgrade-insecure-requests");

  return directives.join("; ");
}
