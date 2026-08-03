/* global NexT, CONFIG, Pjax */

var pjax;
var initRetries = 0;
var maxInitRetries = 200;
var pjaxLoadingTimer = null;
var pjaxPendingHref = '';

function clearPjaxLoadingState() {
  if (pjaxLoadingTimer) {
    clearTimeout(pjaxLoadingTimer);
    pjaxLoadingTimer = null;
  }
  document.documentElement.classList.remove('pjax-loading');
}

function initPjaxWhenReady() {
  if (window.pjax) {
    pjax = window.pjax;
    return;
  }

  const PjaxCtor = typeof window.Pjax === 'function' ? window.Pjax : null;
  if (!PjaxCtor) {
    if (initRetries >= maxInitRetries) {
      console.warn('[NexT] PJAX constructor not found, skip PJAX and fallback to full page navigation.');
      return;
    }
    initRetries += 1;
    setTimeout(initPjaxWhenReady, 50);
    return;
  }

  initRetries = 0;

  pjax = new PjaxCtor({
    selectors: [
      'title',
      '.main-inner'
    ],
    analytics: false,
    cacheBust: false,
    scrollTo : !CONFIG.bookmark.enable
  });

  document.addEventListener('click', event => {
    const link = event.target.closest ? event.target.closest('a[href]') : null;
    if (!link) return;
    if (link.origin !== window.location.origin) return;
    pjaxPendingHref = link.href;
  }, true);

  document.addEventListener('pjax:send', () => {
    clearPjaxLoadingState();
    document.documentElement.classList.add('pjax-loading');
    pjaxLoadingTimer = setTimeout(() => {
      const fallbackHref = pjaxPendingHref || window.location.href;
      window.location.href = fallbackHref;
    }, 10000);
  });

  document.addEventListener('pjax:success', () => {
    clearPjaxLoadingState();
    pjax.executeScripts(document.querySelectorAll('script[data-pjax]'));
    NexT.boot.refresh();
    // Define Motion Sequence & Bootstrap Motion.
    if (CONFIG.motion.enable) {
      NexT.motion.integrator
        .init()
        .add(NexT.motion.middleWares.subMenu)
        // Add sidebar-post-related transition.
        .add(NexT.motion.middleWares.sidebar)
        .add(NexT.motion.middleWares.postList)
        .bootstrap();
    }
    if (CONFIG.sidebar.display !== 'remove') {
      const hasTOC = document.querySelector('.post-toc');
      const sidebarInner = document.querySelector('.sidebar-inner');
      if (sidebarInner) {
        sidebarInner.classList.toggle('sidebar-nav-active', hasTOC);
        NexT.utils.activateSidebarPanel(hasTOC ? 0 : 1);
        NexT.utils.updateSidebarPosition();
      }
    }
  });

  document.addEventListener('pjax:complete', clearPjaxLoadingState);
  document.addEventListener('pjax:error', () => {
    clearPjaxLoadingState();
    if (pjaxPendingHref) {
      window.location.href = pjaxPendingHref;
    }
  });

  window.pjax = pjax;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPjaxWhenReady, { once: true });
} else {
  initPjaxWhenReady();
}
