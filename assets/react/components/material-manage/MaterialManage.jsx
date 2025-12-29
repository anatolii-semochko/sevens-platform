import React, { useEffect, useState } from 'react'
import MaterialApi from '@react/api/materialApi'
import { fetchHDTokenByPublicKey } from '@react/api/nodeApi'
import { RepeatableQuery } from '@react/api/RepeatableQuery'
import { ToggleSwitch } from '@react/components/form-elements/Inputs'
import { MaterialEdit } from '@react/components/material-manage/edit/MaterialEdit'
import { MaterialSale } from '@react/components/material-manage/sale/MaterialSale'
import { TokenBurn } from '@react/components/material-manage/burn/TokenBurn'
import { MaterialRemove } from '@react/components/material-manage/remove/MaterialRemove'
import { TokenInfo } from '@react/components/info-componnents/token/TokenInfo'
import { MaterialPreview } from '@react/components/info-componnents/material/MaterialInfo'
import { ErrorMessageBlock } from '@react/components/info-componnents/Messages'

const materialApi = new MaterialApi()

const MaterialManage = ({token}) => {
    const [material, setMaterial] = useState(null)
    const [loadingTokenData, setLoadingTokenData] = useState(true)
    const [tokenData, setTokenData] = useState(null)
    const [materialForm, setMaterialForm] = useState(null)
    const [errorMessage, setErrorMessage] = useState(null)

    const getMaterial = async () => {
        try {
            const data = await materialApi.get(token)
            // Material already contains logoUrl from backend
            setMaterial(data.material)
        } catch (error) {
            setErrorMessage(error.message)
        }
    }

    useEffect(() => {
        getMaterial().catch()
    }, [])

    useEffect(() => {
        if (material && tokenData && material.active && tokenData.error) {
            handlerSave({active: false}).catch()
        }
    }, [material, tokenData])

    const handlerSave = async (materialData) => {
        try {
            setErrorMessage(null)
            if (materialData) {
                await materialApi.patch(token, materialData)
            }
            await getMaterial()
            setMaterialForm(null)
            if (!materialData) {
                setTokenData(null)
                setLoadingTokenData(true)
            }
        } catch (error) {
            setErrorMessage(error.message)
            if (tokenOk() && materialData) {
                setMaterialForm('MaterialEdit')
            }
        }
    }

    const tokenOk = () => tokenData && !tokenData.error

    const componentsMap = { MaterialEdit, MaterialSale, TokenBurn, MaterialRemove }

    const ComponentToRender = componentsMap[materialForm] || null
    if (materialForm) return (
        <ComponentToRender {...{material, tokenData, handlerSave, setMaterialForm, errorMessage, setErrorMessage}} />
    )

    return (
        <div>
            <RepeatableQuery
                apiEndpoint={(token) => fetchHDTokenByPublicKey(token)}
                params={token}
                onSuccess={setTokenData}
                onError={(error) => setErrorMessage(error.message)}
                processing={loadingTokenData}
                setProcessing={setLoadingTokenData}
                loadingMessage={'Loading token data from blockchain...'}
                cancelButton={false}
                className={'mb-4'}
            />
            <TokenInfo tokenData={tokenData} />
            <MaterialPreview material={material} logoUrl={material?.logoUrl} />

            {material && !material?.active && tokenOk() && (
                <ErrorMessageBlock
                    message={'Your publication is deactivated. You can activate it if all required public data is filled.'}
                    className={'mb-4'}
                />
            )}

            {tokenOk() && (
                <div>
                    <div className="row mb-4">
                        <div className="col-8">Material active status:</div>
                        <div className="col-4">
                            <ToggleSwitch
                                checked={material?.active}
                                onChange={async (active) => await handlerSave({active})}
                                size={'lg'}
                            />
                        </div>
                    </div>
                    <div className="row mb-3">
                        <div className="col-8">Token sales management:</div>
                        <div className="col-4">
                            <button className="btn btn-primary w-100" onClick={() => setMaterialForm('MaterialSale')}>
                                Sales management
                            </button>
                        </div>
                    </div>
                    <div className="row mb-3">
                        <div className="col-8">Edit publication:</div>
                        <div className="col-4">
                            <button className="btn btn-primary w-100" onClick={() => setMaterialForm('MaterialEdit')}>
                                Edit publication
                            </button>
                        </div>
                    </div>
                    {tokenData.metadata.canBeBurned && (
                        <div className="row mb-4">
                            <div className="col-8">Burn token and remove publication:</div>
                            <div className="col-4">
                                <button className="btn btn-primary w-100" onClick={() => setMaterialForm('TokenBurn')}>
                                    Burn token
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {material && tokenData && !tokenOk() && (
                <button className="btn btn-primary w-100 mb-4" onClick={() => setMaterialForm('MaterialRemove')}>
                    Remove material
                </button>
            )}

            <div className="d-flex justify-content-end row mb-3">
                <div className="col col-6">
                    <a className="btn btn-secondary w-100" href={Routing.generate('material_manage')}>
                        Back to materials management
                    </a>
                </div>
                <div className="col col-6">
                    <a className="btn btn-primary w-100" href={Routing.generate('material_page', {token})}>
                        Go to the public material page
                    </a>
                </div>
            </div>
        </div>
    )
}

export default MaterialManage
