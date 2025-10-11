import React from 'react'

export const MintedInfo = ({minted}) => minted && (
    <div className="alert-success alert text-break p-4 mb-4">
        <h4 className="text-center">Congratulations !</h4>
        <p className="text-center">Your token has been successfully minted.</p>
        <div className="d-flex justify-content-center">
            <InnerTable data={[
                ['Token public key', minted.mint],
                ['Transaction signature', minted.signature],
            ]} />
        </div>
    </div>
)

export const TryMoreOptions = ({minted, handlerClear}) => minted && (
    <div className="d-flex flex-column align-items-center gap-2 text-center mb-3">
        <h6>You can try:</h6>
        <div className="d-flex flex-wrap justify-content-center gap-2">
            <a href={Routing.generate('check_token')} className="btn btn-primary">Check your token container</a>
            <button className="btn btn-primary" onClick={handlerClear}>Mint a new token</button>
            <a href={Routing.generate('create_material_from_token')} className="btn btn-primary">
                Publish material on site
            </a>
        </div>
    </div>
)

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
