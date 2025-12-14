/**
 * SEO Analysis Utility
 * Contains logic for analyzing page SEO elements and detecting errors
 */

// Constants
export const PAGE_LOADING_WARNING_LIMIT = 4000 // ms
export const PAGE_LOADING_ERROR_LIMIT = 10000 // ms
export const PAGE_LENGTH_WARNING_LIMIT = 20000 // bytes
export const PAGE_LENGTH_ERROR_LIMIT = 40000 // bytes

/**
 * Analyzes SEO data and detects errors
 * @param {Object} data - SEO data collected from the page
 * @returns {Object} Error analysis with counts and critical errors
 */
export const analyzeErrors = (data) => {
    let totalErrors = 0
    let totalWarnings = 0
    let linkErrors = 0
    let linkWarnings = 0
    let imagesErrors = 0
    const criticalErrors = []

    // Check page metrics
    if (data.page_length > PAGE_LENGTH_ERROR_LIMIT) {
        totalErrors++
    } else if (data.page_length > PAGE_LENGTH_WARNING_LIMIT) {
        totalWarnings++
    }

    if (data.loading_time > PAGE_LOADING_ERROR_LIMIT) {
        totalErrors++
    } else if (data.loading_time > PAGE_LOADING_WARNING_LIMIT) {
        totalWarnings++
    }

    // Check critical SEO meta tags only
    if (!data.seo.title) {
        totalErrors++
    }

    if (!data.seo.description) {
        totalErrors++
    }

    // Analyze links
    data.tags_a.forEach((link) => {
        const isEmpty = !link.label?.trim() && !link.innerHTML?.trim()
        const hasProblematicHref = isNotLink(link.href) || (isHostItself(link.href) && link.href.includes('//'))

        // Link errors - empty links or problematic hrefs
        if (isEmpty || hasProblematicHref) {
            linkErrors++
        }

        // Link warnings - no label and no title
        if (!link.label?.trim() && !link.title) {
            linkWarnings++
        }
    })

    // Analyze images
    data.tags_img.forEach((img) => {
        // Check for missing or invalid src
        if (img.src === '#' || !img.src) {
            imagesErrors++
        }

        // Check for missing alt attribute
        if (!img.alt) {
            imagesErrors++
        }
    })

    return {
        total: totalErrors,
        totalWarnings: totalWarnings,
        linkErrors: linkErrors,
        linkWarnings: linkWarnings,
        images: imagesErrors,
        critical: criticalErrors,
    }
}

export const isNotLink = (href) => !href || href === '#' || href.includes('javascript:')
export const isLinkExternal = (href) => href && href.includes('//') && !href.includes(window.location.hostname)
export const isLinkItself = (href) => {
    if (isNotLink(href)) {
        return false
    }

    try {
        const linkUrl = new URL(href, window.location.origin)
        const currentUrl = new URL(window.location.href)

        return linkUrl.pathname === currentUrl.pathname &&
               linkUrl.search === currentUrl.search &&
               linkUrl.hostname === currentUrl.hostname
    } catch (e) {
        return false
    }
}
export const isHostItself = (href) => {
    if (isNotLink(href)) {
        return false
    }

    try {
        const linkUrl = new URL(href, window.location.origin)
        const currentUrl = new URL(window.location.href)

        return linkUrl.host === currentUrl.host
    } catch (e) {
        return false
    }
}

export const sortLinksByHref = (links) => {
    return [...links].sort((a, b) => {
        const hrefA = (a.href || '').trim()
        const hrefB = (b.href || '').trim()
        return hrefA.localeCompare(hrefB)
    })
}

export const formatPageSize = (bytes) => {
    return `${(bytes / 1000).toFixed(2)} Kb`
}

export const formatLoadingTime = (ms) => {
    return `${(ms / 1000).toFixed(2)} sec`
}
