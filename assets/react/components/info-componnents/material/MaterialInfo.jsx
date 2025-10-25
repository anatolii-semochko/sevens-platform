import React, {useEffect, useState} from 'react'
import MaterialApi from '@react/api/materialApi'
import { route } from '@js/router/routing-with-locale'

const materialApi = new MaterialApi()

export const LogoPreview = ({logo}) => logo ? (
    <div className="d-flex justify-content-center">
        <img src={window.AppConfig.path.materials + '/' + logo} alt={logo} />
    </div>
) : (
    <div className="bg-light rounded d-flex align-items-center justify-content-center py-5">
        <span className="small text-muted">No main file selected</span>
    </div>
)

export const MaterialPreview = ({material}) => {
    if (!material) {
        return
    }

    return (
        <div className="row my-4">
            <div className="col-lg-4 col-md-12">
                <LogoPreview logo={material?.logo} />
            </div>
            <div className="col-lg-8 col-md-12">
                <p>Title: {material?.title}</p>
                <p>Description: {material?.description}</p>
                <p>Price: {material?.price ? ('On sale: ' + material?.price + ' $SEV') : 'Not on sale'}</p>
            </div>
        </div>
    )
}

export const MaterialInfo = ({material, tokenPublicKey}) => {
    const [materialData, setMaterialData] = useState(material || null)

    useEffect(() => {
        setMaterialData(null)
        if (tokenPublicKey) {
            materialApi.get(tokenPublicKey).then(setMaterialData)
        }
    }, [tokenPublicKey])

    if (!materialData) {
        return
    }

    return (
        <div>
            <h4 className="text-center p-3">Publication for this token</h4>
            <MaterialPreview material={materialData}/>
            <a href={route('material_page' ,{token: tokenPublicKey})} className="btn btn-primary fs-4 w-100 p-2 mb-2">
                Visit publication page
            </a>
        </div>
    )
}
