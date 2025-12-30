import React, { useRef, useEffect, useState } from 'react'

export const PriceHistoryChart = ({ history }) => {
    const containerRef = useRef(null)
    const [containerWidth, setContainerWidth] = useState(600)

    useEffect(() => {
        const updateWidth = () => {
            if (containerRef.current) {
                setContainerWidth(containerRef.current.offsetWidth - 20) // minus small padding
            }
        }

        updateWidth()
        window.addEventListener('resize', updateWidth)
        return () => window.removeEventListener('resize', updateWidth)
    }, [])

    // Filter only entries with prices (not cancellations)
    const priceHistory = history.filter(entry => entry.price && entry.price > 0)

    if (!history || priceHistory.length < 2) {
        return
    }

    if (priceHistory.length === 0) {
        return (
            <div className="text-center text-muted p-4">
                <p>No price data to display</p>
            </div>
        )
    }

    // Chart dimensions - responsive
    const width = Math.max(containerWidth, 400) // minimum width
    const height = Math.max(width * 0.4, 250) // responsive height based on width, minimum 250px
    const padding = Math.max(width * 0.04, 40) // responsive padding, minimum 40px

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

    // Responsive font sizes
    const baseFontSize = Math.max(width / 50, 10)
    const labelFontSize = Math.max(width / 40, 12)

    return (
        <div className="mt-4 mb-4" ref={containerRef}>
            <div className="w-100">
                <svg
                    width="100%"
                    height={height}
                    viewBox={`0 0 ${width} ${height}`}
                    preserveAspectRatio="xMidYMid meet"
                    className="border rounded"
                    style={{ maxWidth: '100%', height: 'auto' }}
                >
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
                                fontSize={baseFontSize/2}
                                fill="#666"
                            >
                                {line.price}
                            </text>
                        </g>
                    ))}

                    {/* Price line */}
                    <path
                        d={pathData}
                        fill="none"
                        stroke="#007bff"
                        strokeWidth={Math.max(width / 300, 2)}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {/* Data points */}
                    {dataPoints.map((point, index) => (
                        <g key={index}>
                            <circle
                                cx={point.x}
                                cy={point.y}
                                r={Math.max(width / 150, 3)}
                                fill="#007bff"
                                stroke="white"
                                strokeWidth={Math.max(width / 300, 1)}
                            />
                            <title>
                                Price: {point.price} SOL
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
                        strokeWidth={Math.max(width / 300, 1)}
                    />
                    <line
                        x1={padding}
                        y1={height - padding}
                        x2={width - padding}
                        y2={height - padding}
                        stroke="#333"
                        strokeWidth={Math.max(width / 300, 1)}
                    />
                </svg>
            </div>

            {/* Price statistics */}
            <div className="row mt-3">
                <div className="col-4 text-center">
                    <small className="text-muted">Min Price</small>
                    <div className="fw-bold">{minPrice.toFixed(2)} SOL</div>
                </div>
                <div className="col-4 text-center">
                    <small className="text-muted">Max Price</small>
                    <div className="fw-bold">{maxPrice.toFixed(2)} SOL</div>
                </div>
                <div className="col-4 text-center">
                    <small className="text-muted">Current Price</small>
                    <div className="fw-bold">{prices[prices.length - 1].toFixed(2)} SOL</div>
                </div>
            </div>
        </div>
    )
}
