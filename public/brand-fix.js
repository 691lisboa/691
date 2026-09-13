(() => {
  'use strict'

  const BRAND_RE = /691\s*\.pt/g
  const SKIP_SELECTOR = 'script,style,textarea,pre,code,svg,.brand-optical,.site-brand,.lp-brand'

  function shouldSkip(node) {
    const parent = node?.parentElement
    return !parent || Boolean(parent.closest(SKIP_SELECTOR))
  }

  function tightenTextNode(node) {
    if (!node || node.nodeType !== Node.TEXT_NODE || shouldSkip(node)) return

    const value = node.nodeValue || ''
    BRAND_RE.lastIndex = 0
    if (!BRAND_RE.test(value)) return
    BRAND_RE.lastIndex = 0

    const fragment = document.createDocumentFragment()
    let cursor = 0
    let match

    while ((match = BRAND_RE.exec(value)) !== null) {
      if (match.index > cursor) {
        fragment.appendChild(document.createTextNode(value.slice(cursor, match.index)))
      }

      const brand = document.createElement('span')
      brand.className = 'brand-optical'
      brand.appendChild(document.createTextNode('691'))

      const suffix = document.createElement('span')
      suffix.className = 'brand-optical-suffix'
      suffix.textContent = '.pt'
      brand.appendChild(suffix)

      fragment.appendChild(brand)
      cursor = match.index + match[0].length
    }

    if (cursor < value.length) {
      fragment.appendChild(document.createTextNode(value.slice(cursor)))
    }

    node.replaceWith(fragment)
  }

  function process(root) {
    if (!root) return

    if (root.nodeType === Node.TEXT_NODE) {
      tightenTextNode(root)
      return
    }

    if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) return
    if (root.nodeType === Node.ELEMENT_NODE && root.matches(SKIP_SELECTOR)) return

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
    const nodes = []
    let current
    while ((current = walker.nextNode())) nodes.push(current)
    nodes.forEach(tightenTextNode)
  }

  function start() {
    if (!document.body) return

    process(document.body)

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'characterData') {
          tightenTextNode(mutation.target)
          continue
        }
        mutation.addedNodes.forEach(process)
      }
    })

    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true
    })
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true })
  } else {
    start()
  }
})()
