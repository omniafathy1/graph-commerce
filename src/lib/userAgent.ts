export function describeUserAgent(ua: string | null | undefined): string {
  if (!ua) return "جهاز غير معروف";

  // الترتيب مهم: Edge وOpera UA بتاعهم فيه "Chrome"، وChrome فيه "Safari"
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /OPR\//.test(ua)
    ? "Opera"
    : /Firefox\//.test(ua)
    ? "Firefox"
    : /Chrome\//.test(ua)
    ? "Chrome"
    : /Safari\//.test(ua)
    ? "Safari"
    : "متصفح";

  // برضو مهم: iPhone UA فيه "Mac OS X"، وAndroid UA فيه "Linux"
  const os = /iPhone|iPad/.test(ua)
    ? "iOS"
    : /Android/.test(ua)
    ? "Android"
    : /Windows/.test(ua)
    ? "Windows"
    : /Mac OS X/.test(ua)
    ? "macOS"
    : /Linux/.test(ua)
    ? "Linux"
    : "نظام غير معروف";

  return `${browser} على ${os}`;
}