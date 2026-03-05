window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-0HBZ8G0W26');

// Web Vitals: LCP, FID, CLS monitoring via GA4
if ('PerformanceObserver' in window) {
  // Largest Contentful Paint
  try {
    new PerformanceObserver(function (list) {
      var entries = list.getEntries();
      var last = entries[entries.length - 1];
      if (last) {
        gtag('event', 'web_vitals', {
          event_category: 'Performance',
          event_label: 'LCP',
          value: Math.round(last.startTime),
          non_interaction: true
        });
      }
    }).observe({ type: 'largest-contentful-paint', buffered: true });
  } catch (e) {}

  // First Input Delay
  try {
    new PerformanceObserver(function (list) {
      var entries = list.getEntries();
      if (entries.length) {
        gtag('event', 'web_vitals', {
          event_category: 'Performance',
          event_label: 'FID',
          value: Math.round(entries[0].processingStart - entries[0].startTime),
          non_interaction: true
        });
      }
    }).observe({ type: 'first-input', buffered: true });
  } catch (e) {}

  // Cumulative Layout Shift
  try {
    var clsValue = 0;
    new PerformanceObserver(function (list) {
      list.getEntries().forEach(function (entry) {
        if (!entry.hadRecentInput) clsValue += entry.value;
      });
      gtag('event', 'web_vitals', {
        event_category: 'Performance',
        event_label: 'CLS',
        value: Math.round(clsValue * 1000),
        non_interaction: true
      });
    }).observe({ type: 'layout-shift', buffered: true });
  } catch (e) {}
}
