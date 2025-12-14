import {isNotLink, isLinkExternal, isLinkItself, isHostItself} from '@react/components/seo-test/utils/analysis'

/**
 * Links Tab Component
 * Displays all page links with validation
 */
const LinksTab = ({ links, errors, failedLinks, loadingLinks, linkLoadErrors }) => {
    const getLinkDisplay = (href) => {
        if (!href || isNotLink(href)) return (
            <span className="text-danger fw-bold fst-italic">{href || 'empty'}</span>
        )
        if (isHostItself(href) && href.includes('//')) return (
            <a href={href} target="_blank" className="text-danger fw-bold" title="Link contains //">{href}</a>
        )
        if (isLinkItself(href)) return (
            <a href={href} target="_blank" className="text-success" title="Link to current page">{href}</a>
        )
        if (isLinkExternal(href)) return (
            <a href={href} target="_blank" className="text-danger-emphasis fw-bold" title="External link">{href}</a>
        )
        return (
            <a href={href} target="_blank">{href}</a>
        )
    }

    const addImageStyles = (html) => {
        if (!html || !html.includes('<img')) {
            return html
        }

        // Add styles to img tags
        return html.replace(/<img([^>]*?)>/gi, (match, attrs) => {
            // Check if style attribute already exists
            if (attrs.includes('style=')) {
                // Add to existing style
                return match.replace(/style\s*=\s*["']([^"']*)["']/i, (styleMatch, existingStyle) => {
                    const newStyle = existingStyle.endsWith(';') ? existingStyle : existingStyle + ';'
                    return `style="${newStyle} max-width: 80px; max-height: 50px;"`
                })
            } else {
                // Add new style attribute
                return `<img${attrs} style="max-width: 80px; max-height: 50px;">`
            }
        })
    }

    const getLabelDisplay = (link) => {
        const label = link.label?.trim()
        const innerHTML = link.innerHTML?.trim()

        // If has text label, show it
        if (label) {
            return label
        }

        // If no label but has HTML content, show HTML tags
        if (!label && innerHTML) {
            const styledHTML = addImageStyles(innerHTML)
            return <span dangerouslySetInnerHTML={{ __html: styledHTML }} />
        }

        // If completely empty, show error
        return <span className="text-danger fw-bold fst-italic">empty</span>
    }

    const getTitleDisplay = (link) => {
        if (link.title) return <span>{link.title}</span>
        if (!link.label?.trim()) return <span className="text-warning fw-bold fst-italic">empty</span>
        return <span className="text-muted fst-italic">empty</span>
    }

    const getLinkStatus = (link) => {
        // 1. Check if Failed (недоступний або повертає помилку)
        if (failedLinks && failedLinks.has(link.href)) {
            return <span className="text-danger fw-bold">Failed</span>
        }

        // 2. Check if has Error (empty label/innerHTML OR problematic href)
        const isEmpty = !link.label?.trim() && !link.innerHTML?.trim()
        const hasProblematicHref = isNotLink(link.href) || (isHostItself(link.href) && link.href.includes('//'))

        if (isEmpty || hasProblematicHref) {
            return <span className="text-danger fw-bold">Error</span>
        }

        // 3. Check if has Warning (no label and no title)
        if (!link.label?.trim() && !link.title) {
            return <span className="text-warning fw-bold">Warning</span>
        }

        // 4. Otherwise OK
        return <span className="text-success">OK</span>
    }

    return (
        <div>
            {loadingLinks && (
                <div className="alert alert-info mb-3">
                    <strong>Loading...</strong> Checking links availability
                </div>
            )}

            {errors.critical.length > 0 && (
                <div className="alert alert-danger mb-3">
                    <strong>Critical Errors:</strong>
                    <ul className="mb-0 mt-2">
                        {errors.critical.map((error, index) => (
                            <li key={index} dangerouslySetInnerHTML={{ __html: error }} />
                        ))}
                    </ul>
                </div>
            )}

            {!loadingLinks && linkLoadErrors > 0 && (
                <div className="alert alert-danger mb-3">
                    <strong>Failed:</strong> {linkLoadErrors} link{linkLoadErrors !== 1 ? 's' : ''} failed to load (not accessible)
                </div>
            )}

            <table className="table table-sm table-hover">
                <thead className="table-light">
                    <tr>
                        <th>Label</th>
                        <th>Link</th>
                        <th>Title</th>
                        <th>Target</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {links.map((link, index) => (
                        <tr key={index}>
                            <td>{getLabelDisplay(link)}</td>
                            <td>{getLinkDisplay(link.href)}</td>
                            <td>{getTitleDisplay(link)}</td>
                            <td>{link.target || <span className="text-muted fst-italic">empty</span>}</td>
                            <td>
                                {loadingLinks ? (
                                    <span className="text-muted">...</span>
                                ) : (
                                    getLinkStatus(link)
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

export default LinksTab
