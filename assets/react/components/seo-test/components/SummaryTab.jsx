import {
    formatPageSize,
    formatLoadingTime,
    PAGE_LOADING_ERROR_LIMIT,
    PAGE_LOADING_WARNING_LIMIT,
    PAGE_LENGTH_ERROR_LIMIT,
    PAGE_LENGTH_WARNING_LIMIT,
} from '../utils/analysis'

/**
 * Summary Tab Component
 * Displays general page information and SEO meta tags
 */
const SummaryTab = ({ data }) => {
    const summary = {
        'Page length': formatPageSize(data.page_length),
        'Time loading': formatLoadingTime(data.loading_time),
        'Page lang': data.seo.lang || '-',
        'Links Number': data.tags_a.length,
        'Images Number': data.tags_img.length
    }

    const content = {
        'SEO title': data.seo.title || '',
        'SEO description': data.seo.description || ''
    }

    const getCellClass = (key, value) => {
        if (key === 'Page length') return data.page_length > PAGE_LENGTH_ERROR_LIMIT ? 'text-danger fw-bold' : (
            data.page_length > PAGE_LENGTH_WARNING_LIMIT ? 'text-warning fw-bold' : 'text-success'
        )
        if (key === 'Time loading') return data.loading_time > PAGE_LOADING_ERROR_LIMIT ? 'text-danger fw-bold' : (
            data.loading_time > PAGE_LOADING_WARNING_LIMIT ? 'text-warning fw-bold' : 'text-success'
        )
        return ''
    }

    const getContentClass = (value) => {
        return value ? 'text-primary' : 'text-danger fw-bold'
    }

    return (
        <div className="d-flex gap-4">
            <div>
                <h6>General Information</h6>
                <table className="table table-sm table-borderless">
                    <tbody>
                        {Object.entries(summary).map(([key, value]) => (
                            <tr key={key}>
                                <th className="text-muted text-end pe-3" style={{ whiteSpace: 'nowrap' }}>{key}:</th>
                                <td className={getCellClass(key, value)}>{value}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div>
                <h6>SEO Content</h6>
                <table className="table table-sm table-borderless">
                    <tbody>
                        {Object.entries(content).map(([key, value]) => (
                            <tr key={key}>
                                <th className="text-muted text-end pe-3" style={{ whiteSpace: 'nowrap' }}>{key}:</th>
                                <td className={getContentClass(value)}>
                                    {value || <span className="text-danger">empty</span>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default SummaryTab
