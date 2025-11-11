import React, {useEffect, useState} from 'react'
import MaterialApi from '@react/api/materialApi'
import { route } from '@js/router/routing-with-locale'

const materialApi = new MaterialApi()

export const LogoPreview = ({logo, files}) => {
    // If files array is provided, find the file object matching the logo key
    const logoFile = files?.find(file => file.key === logo)

    // Determine logo URL
    let logoUrl = null
    if (logoFile?.url) {
        // File object with URL found (from files array)
        logoUrl = logoFile.url
    } else if (logo) {
        // Convert S3 key to CDN URL (matches backend CdnService)
        // S3 key format: materials/{token}/files/{filename}
        // CDN URL format: https://localhost/s3/sevenstime-materials/materials/{token}/files/{filename}
        if (logo.startsWith('materials/')) {
            logoUrl = `https://localhost/s3/sevenstime-materials/${logo}`
        } else {
            // Legacy filename format (backward compatibility)
            logoUrl = window.AppConfig.path.materials + '/' + logo
        }
    }

    return logoUrl ? (
        <div
            className="d-flex justify-content-center align-items-center bg-light rounded mb-3"
            style={{
                minHeight: '200px',
                maxHeight: '400px',
                overflow: 'hidden'
            }}
        >
            <img
                src={logoUrl}
                alt={logoFile?.name || logo}
                style={{
                    maxWidth: '100%',
                    maxHeight: '400px',
                    width: 'auto',
                    height: 'auto',
                    objectFit: 'contain'
                }}
            />
        </div>
    ) : (
        <div
            className="bg-light rounded d-flex align-items-center justify-content-center mb-3"
            style={{ minHeight: '200px' }}
        >
            <span className="small text-muted">No main file selected</span>
        </div>
    )
}

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
