// functions/[[path]].js
//
// Tugasnya cuma SATU: kalau ada yang buka URL artikel lama tanpa prefix
// bahasa (format sebelum blog ini multi-bahasa, misal
// /cara-kompres-pdf.html), redirect permanen ke versi default (/id/...).
// Ini supaya link lama yang udah ke-index Google atau dibagikan orang
// nggak mendadak 404 begitu struktur folder berubah jadi /id/, /ja/, dst.
//
// Sengaja TIDAK melakukan auto-detect Accept-Language atau geo-redirect —
// biar gampang dirawat dan hasilnya predictable (selalu redirect ke /id/,
// titik). Kalau nanti mau nambah auto-detect bahasa browser, itu logika
// terpisah yang ditambah di sini, bukan di-assume dari awal.

const SUPPORTED_LANGS = ['id', 'en', 'ja', 'ko', 'zh'];

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  // Root, aset (shared/, data/, favicon, dst), dan apapun yang sudah
  // punya prefix bahasa yang valid (/id/..., /ja/..., dst) dibiarkan lewat
  // apa adanya ke routing/asset normal.
  const firstSegment = path.split('/')[1];
  if (!firstSegment || SUPPORTED_LANGS.includes(firstSegment) || path.includes('.') === false) {
    return context.next();
  }

  // Hanya tangani path artikel lama: /nama-artikel.html (satu segmen,
  // berakhiran .html, bukan di dalam folder manapun).
  const segments = path.split('/').filter(Boolean);
  if (segments.length === 1 && path.endsWith('.html')) {
    return Response.redirect(`${url.origin}/id/${segments[0]}${url.search}`, 301);
  }

  return context.next();
}
