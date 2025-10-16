import React from 'react'

export const InnerTable = ({data}) => {
    const getValue = (value) => {
        if (Array.isArray(value) && value[1]) {
            return <span className={value[1]}>{value[0] || '-'}</span>
        }
        return value || '-'
    }

    return (
        <div className="d-flex justify-content-center">
            <table className="table-sm w-auto text-start">
                <tbody>
                {data.map((row, key) => (
                    <tr key={key}>
                        <td className="text-nowrap">{row[0]}:</td>
                        <td className="ps-3 fw-bold text-break">{getValue(row[1])}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    )
}
