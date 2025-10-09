import React, { useEffect, useState } from 'react'
import MaterialApi from '@react/api/materialApi'
import { fetchSevensTokenByPublicKey } from '@react/api/nodeApi'
import { MaterialEdit } from '@react/components/material-manage/edit/MaterialEdit'
import { MaterialSale } from '@react/components/material-manage/sale/MaterialSale'
import { TokenInfo } from '@react/components/info-componnents/token/TokenInfo'
import { ToggleSwitch } from '@react/components/form-elements/Inputs'

const materialApi = new MaterialApi()

const MaterialManage = ({token}) => {
    const [material, setMaterial] = useState(null)
    const [tokenData, setTokenData] = useState(null)
    const [materialForm, setMaterialForm] = useState(null)
    const [errorMessage, setErrorMessage] = useState(null)
    const [isOn, setIsOn] = useState(false)

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
            <p>Token: {material?.token}</p>
            <p>Title: {material?.title}</p>
            <p>Description: {material?.description}</p>
            <p>Active: {material?.active ? 'YES' : 'NO'}</p>
            <p>Price: {material?.price ? (material?.price + ' $SEV') : 'Not on sale'}</p>
            <TokenInfo tokenData={tokenData} />
            <table>
                <tbody className="table">
                <tr>
                    <td className="pt-2 pe-3">Material active status</td>
                    <td>
                        <ToggleSwitch
                            checked={isOn}
                            onChange={(v) => setIsOn(v)}
                            inline={false}
                            size={'lg'}
                        />
                    </td>
                </tr>
                <tr>
                    <td className="pt-2 pe-3">Edit material</td>
                    <td>
                        <button className="btn btn-primary" onClick={() => setMaterialForm('MaterialEdit')}>
                            Edit publication
                        </button>
                    </td>
                </tr>
                <tr>
                    <td className="pt-2 pe-3">Sale material</td>
                    <td>
                        <button className="btn btn-primary" onClick={() => setMaterialForm('MaterialSale')}>
                            Change sale status
                        </button>
                    </td>
                </tr>
                <tr>
                    <td className="pt-2 pe-3">Remove material</td>
                    <td>
                        <button className="btn btn-primary" onClick={() => setMaterialForm('MaterialSale')}>
                            Remove material
                        </button>
                    </td>
                </tr>
                <tr>
                    <td className="pt-2 pe-3">Burn token and remove material</td>
                    <td>
                        <button className="btn btn-primary" onClick={() => setMaterialForm('MaterialSale')}>
                            Burn token
                        </button>
                    </td>
                </tr>
                </tbody>
            </table>           <div className="d-flex justify-content-end gap-2">
            <a className="btn btn-secondary px-5" href={Routing.generate('material_manage')}>
                Back
            </a>
        </div>
        </div>
    )
}

export default MaterialManage
