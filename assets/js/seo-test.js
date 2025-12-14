import React from 'react'
import { showModal } from '@js/modal'
import { SeoTest } from '@react/components/seo-test/SeoTest'

/**
 * Stores page load time when the page finishes loading
 */
let pageLoadTime = null

/**
 * Gets accurate page loading time using Performance API
 * @returns {number} Loading time in milliseconds
 */
const getPageLoadingTime = () => {
    // If we already captured the load time, use it
    if (pageLoadTime !== null) {
        return pageLoadTime
    }

    // Try Navigation Timing API Level 2 (modern browsers)
    if (window.performance && typeof window.performance.getEntriesByType === 'function') {
        const navEntries = window.performance.getEntriesByType('navigation')
        if (navEntries.length > 0) {
            const navTiming = navEntries[0]
            return navTiming.loadEventEnd || navTiming.domContentLoadedEventEnd || 0
        }
    }

    // Fallback to Navigation Timing API Level 1 (older browsers)
    if (window.performance && window.performance.timing) {
        const timing = window.performance.timing
        if (timing.loadEventEnd > 0) {
            return timing.loadEventEnd - timing.navigationStart
        }
        // If loadEventEnd is not available yet, use domContentLoadedEventEnd
        if (timing.domContentLoadedEventEnd > 0) {
            return timing.domContentLoadedEventEnd - timing.navigationStart
        }
    }

    return 0
}

// Capture page load time after window loads
if (document.readyState === 'complete') {
    pageLoadTime = getPageLoadingTime()
} else {
    window.addEventListener('load', () => {
        // Small delay to ensure loadEventEnd is populated
        setTimeout(() => {
            pageLoadTime = getPageLoadingTime()
        }, 0)
    })
}

/**
 * Collects SEO data from the current page
 */
const collectSeoData = () => {
    const seoData = {
        loading_time: getPageLoadingTime(),
        page_length: document.documentElement.innerHTML.length,
        tags_a: [],
        tags_img: [],
        seo: {
            lang: document.documentElement.getAttribute('lang') || '',
            title: document.querySelector('title')?.innerHTML || '',
            keywords: document.querySelector('meta[name="keywords"]')?.getAttribute('content') || '',
            description: document.querySelector('meta[name="description"]')?.getAttribute('content') || ''
        }
    }

    // Collect all links
    document.querySelectorAll('a').forEach(a => {
        const textLabel = a.textContent?.trim() || ''
        const htmlContent = a.innerHTML?.trim() || ''

        seoData.tags_a.push({
            label: textLabel,
            innerHTML: htmlContent,
            title: a.getAttribute('title') || '',
            href: a.getAttribute('href') || '',
            target: a.getAttribute('target') || ''
        })
    })

    // Collect all images
    document.querySelectorAll('img').forEach(img => {
        seoData.tags_img.push({
            src: img.getAttribute('src') || '',
            title: img.getAttribute('title') || '',
            alt: img.getAttribute('alt') || ''
        })
    })

    // Collect ld+json structured data
    const ldJsonScripts = document.querySelectorAll('script[type="application/ld+json"]')
    seoData.ldJson = []

    ldJsonScripts.forEach(script => {
        try {
            const jsonContent = JSON.parse(script.textContent)
            seoData.ldJson.push(jsonContent)
        } catch (e) {
            // Invalid JSON, skip
            console.error('Invalid ld+json:', e)
        }
    })

    return seoData
}

/**
 * Shows SEO test modal with page analysis
 */
export const seo = () => {
    const seoData = collectSeoData()

    showModal({
        id: 'seo-test-modal',
        title: `SEO Test - ${seoData.seo.title || 'Page Analysis'}`,
        body: React.createElement(SeoTest, { data: seoData }),
        size: 'xl'
    })
}
