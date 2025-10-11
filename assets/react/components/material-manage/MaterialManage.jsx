import React, { useEffect, useState } from 'react'
import MaterialApi from '@react/api/materialApi'
import { fetchSevensTokenByPublicKey } from '@react/api/nodeApi'
import { ToggleSwitch } from '@react/components/form-elements/Inputs'
import { MaterialEdit, Preview } from '@react/components/material-manage/edit/MaterialEdit'
import { MaterialSale } from '@react/components/material-manage/sale/MaterialSale'
import { TokenInfo } from '@react/components/info-componnents/token/TokenInfo'

const materialApi = new MaterialApi()

const MaterialManage = ({token}) => {
    const [material, setMaterial] = useState(null)
    const [tokenData, setTokenData] = useState(null)
    const [materialForm, setMaterialForm] = useState(null)
    const [errorMessage, setErrorMessage] = useState(null)

    const getMaterial = async () => {
        try {
            const data = await materialApi.get(token)
            setMaterial(data.material)
            console.log({data})
        } catch (error) {
            setErrorMessage(error.message)
        }
    }

    const getTokenData = async () => {
        try {
            await fetchSevensTokenByPublicKey(token).then(setTokenData)
        } catch (error) {
            setTokenData({error: 'Token not found'})
        }
    }

    useEffect(() => {
        getMaterial().catch()
        getTokenData().catch()
    }, [])

    const handlerSave = async (materialData) => {
        try {
            setErrorMessage(null)
            if (materialData) {
                await materialApi.put(token, materialData)
            } else {
                await getTokenData()
            }
            await getMaterial()
            setMaterialForm(null)
        } catch (error) {
            setErrorMessage(error.message)
            setMaterialForm('MaterialEdit')
        }
    }

    const componentsMap = {
        MaterialEdit,
        MaterialSale,
    }

    const ComponentToRender = componentsMap[materialForm] || null
    if (materialForm) return (
        <ComponentToRender {...{material, tokenData, handlerSave, setMaterialForm, errorMessage, setErrorMessage}} />
    )

    return (
        <div>
            <TokenInfo tokenData={tokenData} />

            <div className="row mt-5 mb-5">
                <div className="col-lg-4 col-md-12">
                    <Preview logo={material?.logo} />
                </div>
                <div className="col-lg-4 col-md-12">
                    <p>Title: {material?.title}</p>
                    <p>Description: {material?.description}</p>
                    <p>Active: {material?.active ? 'YES' : 'NO'}</p>
                    <p>Price: {material?.price ? (material?.price + ' $SEV') : 'Not on sale'}</p>
                </div>
            </div>

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
                <div className="col-8">Edit material:</div>
                <div className="col-4">
                    <button className="btn btn-primary w-100" onClick={() => setMaterialForm('MaterialEdit')}>
                        Edit publication
                    </button>
                </div>
            </div>
            <div className="row mb-3">
                <div className="col-8">Sale material:</div>
                <div className="col-4">
                    <button className="btn btn-primary w-100" onClick={() => setMaterialForm('MaterialSale')}>
                        Change sale status
                    </button>
                </div>
            </div>
            <div className="row mb-3">
                <div className="col-8">Remove material:</div>
                <div className="col-4">
                    <button className="btn btn-primary w-100">
                        Remove material
                    </button>
                </div>
            </div>
            <div className="row mb-4">
                <div className="col-8">Burn token and remove material:</div>
                <div className="col-4">
                    <button className="btn btn-primary w-100">
                        Burn token
                    </button>
                </div>
            </div>

            <div className="d-flex justify-content-end gap-2 mb-3">
                <a className="btn btn-secondary px-5" href={Routing.generate('material_manage')}>
                    Back to materials management
                </a>
                <a className="btn btn-primary px-5" href={Routing.generate('material_page', {token})}>
                    Go to the public material page
                </a>
            </div>

        </div>
    )
}

export default MaterialManage
