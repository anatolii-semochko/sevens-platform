import React, { useState } from 'react'
import MaterialApi from '@react/api/materialApi'
import { route } from '@js/router/routing-with-locale'
import { TokenInfo } from '@react/components/info-componnents/token/TokenInfo'
import { ErrorMessageBlock } from '@react/components/info-componnents/Messages'

const materialApi = new MaterialApi()

export const MaterialRemove = ({material, tokenData, setMaterialForm}) => {
    const [error, setError] = useState(null)

    const handlerRemoveMaterial = async () => {
        try {
            await materialApi.delete(material.token)
            window.location.href = route('material_manage')
        } catch (error) {
            setError(error)
        }
    }

    return (
        <div className="mb-3 pt-2">
            <h4 className="text-center mb-4">Remove publication "{material.title || 'No titled'}" from site</h4>
            <h5 className={'mb-3'}>
                A publication can only be removed from the site when the represented it token is no more active on the blockchain.
            </h5>
            <TokenInfo tokenData={tokenData} />
            <ErrorMessageBlock message={error} />
            <div className="d-flex justify-content-end row mb-3">
                <div className="col col-6">
                    <button className="btn btn-primary w-100" onClick={() => setMaterialForm(null)}>Cancel</button>
                </div>
                <div className="col col-6">
                    <button className="btn btn-danger w-100" onClick={() => handlerRemoveMaterial()}>
                        Remove Publication
                    </button>
                </div>
            </div>
        </div>
    )
}
