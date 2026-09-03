/* Google Analytics 4 configuration.
   `gtag` and the consent defaults are defined inline in <head> (Consent Mode v2),
   BEFORE this file and before gtag.js. Here we only configure the property and
   the Web Vitals reporting. Consent is granted/updated from assets/js/main.js. */
window.dataLayer = window.dataLayer || [];
if (typeof gtag !== 'function') { function gtag(){ dataLayer.push(arguments); } }

gtag('js', new Date());
// url_passthrough keeps campaign info working while ad_storage is denied.
gtag('config', 'G-0HBZ8G0W26', { anonymize_ip: true, url_passthrough: true });

/* Web Vitals: LCP, FID, CLS via GA4 (non-blocking, best-effort) */
if ('PerformanceObserver' in window) {
  try {
    new PerformanceObserver(function (list) {
      var e = list.getEntries(); var last = e[e.length - 1];
      if (last) gtag('event', 'web_vitals', { event_category: 'Performance', event_label: 'LCP', value: Math.round(last.startTime), non_interaction: true });
    }).observe({ type: 'largest-contentful-paint', buffered: true });
  } catch (e) {}
  try {
    new PerformanceObserver(function (list) {
      var e = list.getEntries();
      if (e.length) gtag('event', 'web_vitals', { event_category: 'Performance', event_label: 'FID', value: Math.round(e[0].processingStart - e[0].startTime), non_interaction: true });
    }).observe({ type: 'first-input', buffered: true });
  } catch (e) {}
  try {
    var cls = 0;
    new PerformanceObserver(function (list) {
      list.getEntries().forEach(function (entry) { if (!entry.hadRecentInput) cls += entry.value; });
      gtag('event', 'web_vitals', { event_category: 'Performance', event_label: 'CLS', value: Math.round(cls * 1000), non_interaction: true });
    }).observe({ type: 'layout-shift', buffered: true });
  } catch (e) {}
}
