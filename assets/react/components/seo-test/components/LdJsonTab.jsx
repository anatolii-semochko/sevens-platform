/**
 * LD+JSON Tab Component
 * Displays structured data (ld+json) found on the page
 */
const LdJsonTab = ({ ldJson }) => {
    const hasLdJson = ldJson && ldJson.length > 0

    if (!hasLdJson) {
        return (
            <div>
                <div className="alert alert-danger mb-3">
                    <strong>Error:</strong> No structured data (ld+json) found on this page
                </div>
            </div>
        )
    }

    return (
        <div>
            <div className="alert alert-success mb-3">
                <strong>Success:</strong> Found {ldJson.length} structured data object{ldJson.length !== 1 ? 's' : ''}
            </div>

            {ldJson.map((jsonObject, index) => (
                <div key={index} className="mb-4">
                    <h6>LD+JSON Object {ldJson.length > 1 ? `#${index + 1}` : ''}</h6>
                    <div className="bg-light p-3 rounded">
                        <pre className="mb-0">
                            {JSON.stringify(jsonObject, null, 2)}
                        </pre>
                    </div>
                </div>
            ))}
        </div>
    )
}

export default LdJsonTab
