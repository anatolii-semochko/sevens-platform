import React, {useEffect, useState} from 'react'
import MaterialApi from '@react/api/materialApi'
import { route } from '@js/router/routing-with-locale'

const materialApi = new MaterialApi()

export const LogoPreview = ({logo, files, logoUrl: providedLogoUrl}) => {
    // Logo is the thumbnail key, find the file object to get preview variant
    const logoFile = files?.find(file => file.keyThumbnail === logo)

    // Determine logo URL (use provided logoUrl first, then find in files, then fallback)
    let logoUrl = providedLogoUrl // Use CDN URL from API if provided

    if (!logoUrl && logoFile) {
        // Use urlPreview (best quality for display), then urlThumbnail, then original url
        logoUrl = logoFile.urlPreview || logoFile.urlThumbnail || logoFile.url
    } else if (!logoUrl && logo) {
        // No file found, use logo thumbnail key directly
        if (logo.startsWith('materials/')) {
            logoUrl = `https://localhost/s3/sevenstime-materials/${logo}`
        } else {
            // Legacy filename format
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

export const MaterialPreview = ({material, logoUrl}) => {
    if (!material) {
        return
    }

    return (
        <div className="row my-4">
            <div className="col-lg-4 col-md-12">
                <LogoPreview logo={material?.logo} files={material?.files} logoUrl={logoUrl} />
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
