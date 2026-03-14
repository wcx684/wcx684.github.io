/* global NexT, CONFIG, Pjax */

var pjax;

function initPjaxWhenReady() {
  if (window.pjax) {
    pjax = window.pjax;
    return;
  }

  const PjaxCtor = typeof window.Pjax === 'function' ? window.Pjax : null;
  if (!PjaxCtor) {
    setTimeout(initPjaxWhenReady, 50);
    return;
  }

  pjax = new PjaxCtor({
    selectors: [
      'title',
      '.main-inner'
    ],
    analytics: false,
    cacheBust: false,
    scrollTo : !CONFIG.bookmark.enable
  });

  document.addEventListener('pjax:success', () => {
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

  window.pjax = pjax;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPjaxWhenReady, { once: true });
} else {
  initPjaxWhenReady();
}
