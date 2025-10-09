import React from 'react'

export const PriceHistoryChart = ({ history }) => {
    if (!history || history.length < 2) {
        return
    }

    // Filter only entries with prices (not cancellations)
    const priceHistory = history.filter(entry => entry.price && entry.price > 0)

    if (priceHistory.length === 0) {
        return (
            <div className="text-center text-muted p-4">
                <p>No price data to display</p>
            </div>
        )
    }

    // Chart dimensions
    const width = 600
    const height = 300
    const padding = 40

    // Get price range
    const prices = priceHistory.map(entry => parseFloat(entry.price))
    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)
    const priceRange = maxPrice - minPrice || 1

    // Create data points
    const dataPoints = priceHistory.map((entry, index) => {
        const x = padding + (index / (priceHistory.length - 1 || 1)) * (width - 2 * padding)
        const y = padding + ((maxPrice - parseFloat(entry.price)) / priceRange) * (height - 2 * padding)
        return { x, y, price: entry.price, date: entry.date }
    })

    // Create path for line chart
    const pathData = dataPoints.map((point, index) =>
        `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
    ).join(' ')

    // Grid lines
    const gridLines = []
    const numGridLines = 5
    for (let i = 0; i <= numGridLines; i++) {
        const y = padding + (i / numGridLines) * (height - 2 * padding)
        const price = maxPrice - (i / numGridLines) * priceRange
        gridLines.push({ y, price: price.toFixed(2) })
    }

    return (
        <div className="mt-4 mb-4">
            <h5 className="text-center mb-3">Price History Chart</h5>
            <div className="d-flex justify-content-center">
                <svg width={width} height={height} className="border rounded">
                    {/* Grid lines */}
                    {gridLines.map((line, index) => (
                        <g key={index}>
                            <line
                                x1={padding}
                                y1={line.y}
                                x2={width - padding}
                                y2={line.y}
                                stroke="#e0e0e0"
                                strokeWidth="1"
                                strokeDasharray="2,2"
                            />
                            <text
                                x={padding - 5}
                                y={line.y + 5}
                                textAnchor="end"
                                fontSize="12"
                                fill="#666"
                            >
                                {line.price} $SEV
                            </text>
                        </g>
                    ))}

                    {/* Price line */}
                    <path
                        d={pathData}
                        fill="none"
                        stroke="#007bff"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {/* Data points */}
                    {dataPoints.map((point, index) => (
                        <g key={index}>
                            <circle
                                cx={point.x}
                                cy={point.y}
                                r="4"
                                fill="#007bff"
                                stroke="white"
                                strokeWidth="2"
                            />
                            <title>
                                Price: {point.price} $SEV
                                {'\n'}Date: {new Date(point.date).toLocaleDateString()}
                            </title>
                        </g>
                    ))}

                    {/* Axes */}
                    <line
                        x1={padding}
                        y1={padding}
                        x2={padding}
                        y2={height - padding}
                        stroke="#333"
                        strokeWidth="2"
                    />
                    <line
                        x1={padding}
                        y1={height - padding}
                        x2={width - padding}
                        y2={height - padding}
                        stroke="#333"
                        strokeWidth="2"
                    />

                    {/* Y-axis label */}
                    <text
                        x="20"
                        y={height / 2}
                        textAnchor="middle"
                        fontSize="14"
                        fill="#666"
                        transform={`rotate(-90 20 ${height / 2})`}
                    >
                        Price ($SEV)
                    </text>

                    {/* X-axis label */}
                    <text
                        x={width / 2}
                        y={height - 10}
                        textAnchor="middle"
                        fontSize="14"
                        fill="#666"
                    >
                        Time
                    </text>
                </svg>
            </div>

            {/* Price statistics */}
            <div className="row mt-3">
                <div className="col-4 text-center">
                    <small className="text-muted">Min Price</small>
                    <div className="fw-bold">{minPrice.toFixed(2)} $SEV</div>
                </div>
                <div className="col-4 text-center">
                    <small className="text-muted">Max Price</small>
                    <div className="fw-bold">{maxPrice.toFixed(2)} $SEV</div>
                </div>
                <div className="col-4 text-center">
                    <small className="text-muted">Current Price</small>
                    <div className="fw-bold">{prices[prices.length - 1].toFixed(2)} $SEV</div>
                </div>
            </div>
        </div>
    )
}
