import { useState, useEffect } from 'react'
import { analyzeErrors, sortLinksByHref } from './utils/analysis'
import SummaryTab from './components/SummaryTab'
import LinksTab from './components/LinksTab'
import ImagesTab from './components/ImagesTab'
import LdJsonTab from './components/LdJsonTab'

export const SeoTest = ({ data }) => {
    const [activeTab, setActiveTab] = useState('summary')
    const [imageLoadErrors, setImageLoadErrors] = useState(0)
    const [loadingImages, setLoadingImages] = useState(true)
    const [linkLoadErrors, setLinkLoadErrors] = useState(0)
    const [loadingLinks, setLoadingLinks] = useState(true)
    const [failedLinks, setFailedLinks] = useState(new Set())

    const errors = analyzeErrors(data)
    const sortedLinks = sortLinksByHref(data.tags_a)

    // Pre-check all images on mount
    useEffect(() => {
        let errorCount = 0
        let loadedCount = 0
        const totalImages = data.tags_img.filter(img => img.src && img.src !== '#').length

        if (totalImages === 0) {
            setLoadingImages(false)
            return
        }

        const checkImage = (src) => {
            return new Promise((resolve) => {
                const img = new Image()
                img.onload = () => resolve(true)
                img.onerror = () => resolve(false)
                img.src = src
            })
        }

        const checkAllImages = async () => {
            for (const img of data.tags_img) {
                if (img.src && img.src !== '#') {
                    const loaded = await checkImage(img.src)
                    if (!loaded) {
                        errorCount++
                    }
                    loadedCount++
                }
            }
            setImageLoadErrors(errorCount)
            setLoadingImages(false)
        }

        checkAllImages().finally()
    }, [data.tags_img])

    // Pre-check all links on mount
    useEffect(() => {
        let errorCount = 0
        const failed = new Set()

        const checkLink = async (href) => {
            // Skip non-http links
            if (!href || href === '#' || href.includes('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) {
                return true
            }

            try {
                // Convert relative URLs to absolute
                const url = new URL(href, window.location.origin)

                // First try with CORS to get status code
                try {
                    const response = await fetch(url.href, {
                        method: 'HEAD',
                        mode: 'cors',
                        cache: 'no-cache',
                        signal: AbortSignal.timeout(5000) // 5 second timeout
                    })

                    // Check if status is error (4xx or 5xx)
                    if (response.status >= 400) {
                        return false // Link returns error status
                    }

                    return true // Link is accessible and returns good status
                } catch (corsError) {
                    // CORS failed, try no-cors mode as fallback
                    try {
                        const response = await fetch(url.href, {
                            method: 'HEAD',
                            mode: 'no-cors',
                            cache: 'no-cache',
                            signal: AbortSignal.timeout(5000)
                        })

                        // no-cors mode doesn't give us status, but if it didn't throw, link is accessible
                        return true
                    } catch (noCorsError) {
                        // Both CORS and no-cors failed
                        return false
                    }
                }
            } catch (e) {
                // URL parsing or other error
                return false
            }
        }

        const checkAllLinks = async () => {
            const uniqueLinks = [...new Set(data.tags_a.map(link => link.href).filter(href =>
                href && href !== '#' && !href.includes('javascript:') && !href.startsWith('mailto:') && !href.startsWith('tel:')
            ))]

            if (uniqueLinks.length === 0) {
                setLoadingLinks(false)
                return
            }

            // Check each unique link
            for (const href of uniqueLinks) {
                const isAccessible = await checkLink(href)
                if (!isAccessible) {
                    failed.add(href)
                }
            }

            // Count all links (not unique) that have failed href
            errorCount = data.tags_a.filter(link => failed.has(link.href)).length

            setLinkLoadErrors(errorCount)
            setFailedLinks(failed)
            setLoadingLinks(false)
        }

        checkAllLinks().finally()
    }, [data.tags_a])

    const getTabBadgeClass = (count) => {
        return count > 0 ? 'bg-danger' : 'bg-success'
    }

    return (
        <div>
            <ul className="nav nav-tabs mb-3" role="tablist">
                <li className="nav-item" role="presentation">
                    <button
                        className={`nav-link ${activeTab === 'summary' ? 'active' : ''}`}
                        onClick={() => setActiveTab('summary')}
                        type="button"
                        role="tab"
                    >
                        General Information
                        {errors.total > 0 && (
                            <span className="badge bg-danger ms-2">{errors.total} Errors</span>
                        )}
                        {errors.totalWarnings > 0 && (
                            <span className="badge bg-warning ms-2">{errors.totalWarnings} Warnings</span>
                        )}
                        {!errors.total && !errors.totalWarnings && (
                            <span className="badge bg-success ms-2">OK</span>
                        )}
                    </button>
                </li>
                <li className="nav-item" role="presentation">
                    <button
                        className={`nav-link ${activeTab === 'links' ? 'active' : ''}`}
                        onClick={() => setActiveTab('links')}
                        type="button"
                        role="tab"
                    >
                        Links
                        {loadingLinks && (
                            <span className="badge bg-secondary ms-2">Loading...</span>
                        )}
                        {!loadingLinks && (
                            <>
                                {errors.linkErrors > 0 && (
                                    <span className="badge bg-danger ms-2">{errors.linkErrors} Errors</span>
                                )}
                                {linkLoadErrors > 0 && (
                                    <span className="badge bg-danger ms-2">{linkLoadErrors} Failed</span>
                                )}
                                {errors.linkWarnings > 0 && (
                                    <span className="badge bg-warning ms-2">{errors.linkWarnings} Warnings</span>
                                )}
                                {!errors.linkErrors && !errors.linkWarnings && !linkLoadErrors && (
                                    <span className="badge bg-success ms-2">OK</span>
                                )}
                            </>
                        )}
                    </button>
                </li>
                <li className="nav-item" role="presentation">
                    <button
                        className={`nav-link ${activeTab === 'images' ? 'active' : ''}`}
                        onClick={() => setActiveTab('images')}
                        type="button"
                        role="tab"
                    >
                        Images
                        {loadingImages && (
                            <span className="badge bg-secondary ms-2">Loading...</span>
                        )}
                        {!loadingImages && (errors.images > 0 || imageLoadErrors > 0) && (
                            <>
                                {errors.images > 0 && (
                                    <span className="badge bg-danger ms-2">{errors.images} Errors</span>
                                )}
                                {imageLoadErrors > 0 && (
                                    <span className="badge bg-danger ms-2">{imageLoadErrors} Failed</span>
                                )}
                            </>
                        )}
                        {!loadingImages && errors.images === 0 && imageLoadErrors === 0 && (
                            <span className="badge bg-success ms-2">OK</span>
                        )}
                    </button>
                </li>
                <li className="nav-item" role="presentation">
                    <button
                        className={`nav-link ${activeTab === 'ldjson' ? 'active' : ''}`}
                        onClick={() => setActiveTab('ldjson')}
                        type="button"
                        role="tab"
                    >
                        LD+JSON
                        {data.ldJson && data.ldJson.length > 0 ? (
                            <span className="badge bg-success ms-2">OK</span>
                        ) : (
                            <span className="badge bg-danger ms-2">Error</span>
                        )}
                    </button>
                </li>
            </ul>

            <div className="tab-content" style={{ fontSize: '13px' }}>
                {activeTab === 'summary' && (
                    <SummaryTab data={data} />
                )}
                {activeTab === 'links' && (
                    <LinksTab
                        links={sortedLinks}
                        errors={errors}
                        failedLinks={failedLinks}
                        loadingLinks={loadingLinks}
                        linkLoadErrors={linkLoadErrors}
                    />
                )}
                {activeTab === 'images' && (
                    <ImagesTab
                        images={data.tags_img}
                        errors={errors}
                        imageLoadErrors={imageLoadErrors}
                        loadingImages={loadingImages}
                    />
                )}
                {activeTab === 'ldjson' && (
                    <LdJsonTab ldJson={data.ldJson} />
                )}
            </div>
        </div>
    )
}
