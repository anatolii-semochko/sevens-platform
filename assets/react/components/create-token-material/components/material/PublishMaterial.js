import React, { useEffect, useState } from 'react'
import store from '@react/store'
import MaterialApi from '@react/api/materialApi'
import { ErrorMessageBlock } from '@react/components/info-componnents/Messages'
import { ButtonLargeWidth } from '@react/components/form-elements/Buttons'

const materialApi = new MaterialApi()

export const PublishMaterial = ({container, tokenData, walletSignature}) => {
    const [errorMessage, setErrorMessage] = useState(null)
    const [materialExists, setMaterialExists] = useState(null)

    const handlerPublish = async () => {
        setErrorMessage(null)
        const response = await materialApi.create(
            {
                name: container.file.name,
                size: container.file.size,
                hash: container.hash,
            },
            tokenData.tokenPublicKey,
            walletSignature || null,
        )

        // TODO - change author ro user
        if (response.material.author.id === store.getState().user?.id) {
            window.location.href = Routing.generate('material_manage_one', {token: tokenData.tokenPublicKey})
        } else {
            setMaterialExists(true)
        }
    }

    useEffect(() => {
        if (walletSignature) {
            handlerPublish().catch(setErrorMessage)
        }
    }, [walletSignature])


    if (materialExists) return (
        <div>
            <div className="alert-danger alert text-center pb-2">
                <h5>Material for this token container already exists.</h5>
            </div>
            <a
                href={Routing.generate('material_page', {token: tokenData.tokenPublicKey})}
                className="btn btn-primary w-100 fs-5 p-3 mb-3"
            >
                Go to existing material page
            </a>
        </div>
    )

    return !!errorMessage && (
        <div>
            <ErrorMessageBlock error={errorMessage}/>
            <ButtonLargeWidth className="btn-success" label={'Publish material'} onClick={handlerPublish}/>
        </div>
    )
}
