import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { getExt, isAudio, isImage, isPdf, isVideo } from '@js/utils/file'
import { Input, TextArea } from '@react/components/form-elements/Inputs'
import { LogoPreview } from '@react/components/info-componnents/material/MaterialInfo'
import { MessagesBlock } from '@react/components/info-componnents/Messages'
import MaterialApi from '@react/api/materialApi'

const materialApi = new MaterialApi()

const Title = ({title, setTitle, error, setErrorMessage}) => (
    <div className="col-12">
        <label htmlFor="tokenTitle" className="form-label">Publication title:</label>
        <Input
            id={'tokenTitle'}
            placeholder={'required'}
            maxLength={64}
            value={title}
            onChange={setTitle}
            setErrorMessage={setErrorMessage}
        />
        {error && <div className="invalid-feedback">Invalid</div>}
    </div>
)

const Description = ({description, setDescription, error, setErrorMessage}) => (
    <div className="col-12">
        <label htmlFor="tokenDescription" className="form-label">Publication extended description:</label>
        <TextArea
            id={'tokenDescription'}
            placeholder={'optional'}
            maxLength={1024}
            rows={8}
            value={description}
            onChange={setDescription}
            setErrorMessage={setErrorMessage}
        />
        {error && <div className="invalid-feedback">Invalid</div>}
    </div>
)


// const ImagePreview = ({file, width, height}) => {
//     const f = file.file || file
//     const _isV = isVideo(f)
//     const _isI = isImage(f)
//     const _isA = isAudio(f)
//     const _isP = isPdf(f)
//     // const boxW = 160 // _isV ? 160 : 96
//     // const boxH = 90 // _isV ? 90 : 96
//
//     return (
//         <div
//             className="bg-light rounded d-flex align-items-center justify-content-center"
//             style={{ width: width, height: height, overflow: "hidden", minWidth: width }}
//         >
//             {_isI && file.previewUrl && (
//                 <img src={file.previewUrl} alt={file.name} className="img-fluid" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
//             )}
//             {_isV && file.previewUrl && (
//                 <video key={file.previewUrl} controls preload="metadata" style={{ width: "100%", height: "100%" }}>
//                     <source src={file.previewUrl} type={file.type || undefined} />
//                 </video>
//             )}
//             {_isA && file.previewUrl && <audio src={file.previewUrl} controls className="w-100" />}
//             {_isP && file.previewUrl && <embed src={file.previewUrl} type="application/pdf" style={{ width: "100%", height: "100%" }} />}
//             {!file.previewUrl && (
//                 <span className="small text-muted text-center p-1">
//                     {file.diskPath ? "💾" : ""} {file.type || (getExt(file.name) ? `.${getExt(file.name)}` : "file")}
//                 </span>
//             )}
//         </div>
//     )
// }


export const ImageSelectMain = ({files, logo, setLogo}) => {
    // Filter only image files
    const imageFiles = useMemo(() => {
        if (!files || !Array.isArray(files)) return []
        return files.filter(file => {
            const type = file.type?.toLowerCase() || ''
            return type === 'png' || type === 'jpg' || type === 'jpeg' || type === 'gif' || type === 'webp'
        })
    }, [files])

    if (imageFiles.length < 2) return null

    const handleClick = (fileThumbnailKey) => {
        // Logo should be set to thumbnail key for fast list loading
        setLogo(fileThumbnailKey)
    }

    return (
        <div className="mt-3">
            <label htmlFor="imageSelect" className="form-label">Select main image:</label>
            <div className="row g-2">
                {imageFiles.map((file) => {
                    const isSelected = logo === file.keyThumbnail
                    return (
                        <div key={file.key} className="col-6 col-sm-4 col-md-3 col-lg-4 col-xl-3 mb-2">
                            <div
                                className={`border rounded p-2 position-relative ${
                                    isSelected
                                        ? 'border-primary shadow-sm'
                                        : 'border-light'
                                }`}
                                onClick={() => handleClick(file.keyThumbnail)}
                                style={{
                                    cursor: 'pointer',
                                    height: '140px',
                                    transition: 'all 0.2s ease'
                                }}
                                title={file.name}
                                onMouseEnter={(e) => {
                                    if (!isSelected) {
                                        e.currentTarget.classList.add('border-secondary', 'shadow-sm')
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isSelected) {
                                        e.currentTarget.classList.remove('border-secondary', 'shadow-sm')
                                    }
                                }}
                            >
                                {isSelected && (
                                    <div className="position-absolute top-0 end-0 mt-1 me-1" style={{ zIndex: 1 }}>
                                        <span className="badge bg-primary text-white small">Main</span>
                                    </div>
                                )}
                                <div
                                    className="d-flex align-items-center justify-content-center bg-light rounded"
                                    style={{
                                        height: '90px',
                                        width: '100%',
                                        overflow: 'hidden'
                                    }}
                                >
                                    <img
                                        src={file.urlThumbnail || file.url}
                                        alt={file.name}
                                        style={{
                                            maxWidth: "100%",
                                            maxHeight: "100%",
                                            width: "auto",
                                            height: "auto",
                                            objectFit: "contain"
                                        }}
                                    />
                                </div>
                                <div className="text-center mt-2" style={{ height: '32px', overflow: 'hidden' }}>
                                    <small className={`text-truncate d-block ${
                                        isSelected ? 'text-primary fw-bold' : 'text-muted'
                                    }`} style={{ fontSize: '0.75rem' }}>
                                        {file.name}
                                    </small>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

// export const ImageSelectMain = ({tokenFiles, setTokenFiles}) => {
//     if (!tokenFiles || tokenFiles.length < 2) return null
//
//     const handleClick = (selectedFile) => {
//         setTokenFiles(prev => prev.map(file => ({
//             ...file,
//             main: file.id === selectedFile.id
//         })))
//     }
//
//     return (
//         <div className="mt-3">
//             <div className="row g-2">
//                 {tokenFiles.map((file) => (
//                     <div key={file.id} className="col-6 col-sm-4 col-md-3 col-lg-4 col-xl-3 mb-2">
//                         <div
//                             className={`border rounded p-2 position-relative transition-all ${
//                                 file.main
//                                     ? 'border-primary shadow-sm'
//                                     : 'border-light hover:border-secondary'
//                             }`}
//                             onClick={() => handleClick(file)}
//                             style={{
//                                 cursor: 'pointer',
//                                 minHeight: '120px'
//                             }}
//                             title={file.name}
//                             onMouseEnter={(e) => {
//                                 if (!file.main) {
//                                     e.target.classList.add('border-secondary', 'shadow-sm')
//                                 }
//                             }}
//                             onMouseLeave={(e) => {
//                                 if (!file.main) {
//                                     e.target.classList.remove('border-secondary', 'shadow-sm')
//                                 }
//                             }}
//                         >
//                             {file.main && (
//                                 <div className="position-absolute top-0 end-0 mt-1 me-1">
//                                     <span className="badge bg-primary text-white small">Main</span>
//                                 </div>
//                             )}
//                             <div style={{ height: '80px', overflow: 'hidden' }} className="d-flex align-items-center justify-content-center">
//                                 <ImagePreview
//                                     file={file}
//                                     width="100%"
//                                     height="80px"
//                                 />
//                             </div>
//                             <div className="text-center mt-2">
//                                 <small className={`text-truncate d-block ${
//                                     file.main ? 'text-primary fw-bold' : 'text-muted'
//                                 }`} style={{ fontSize: '0.75rem' }}>
//                                     {file.name}
//                                 </small>
//                             </div>
//                         </div>
//                     </div>
//                 ))}
//             </div>
//         </div>
//     )
// }

export const MaterialEdit = ({material, handlerSave, setMaterialForm, errorMessage, setErrorMessage}) => {
    const [materialData, setMaterialData] = useState(material)
    const [title, setTitle] = useState(material?.title || '')
    const [description, setDescription] = useState(material?.description || '')
    const [logo, setLogo] = useState(material?.logo || null)
    const [files, setFiles] = useState([])
    const [filesLoading, setFilesLoading] = useState(true)

    // Fetch files with URLs when component mounts
    useEffect(() => {
        const fetchFiles = async () => {
            if (!material?.token) return

            setFilesLoading(true)
            try {
                const archiveStatus = await materialApi.getArchiveStatus(material.token)
                if (archiveStatus?.files) {
                    setFiles(archiveStatus.files)

                    // Auto-select first image's thumbnail as logo if none is set
                    if (!logo && archiveStatus.files.length > 0) {
                        const firstImage = archiveStatus.files.find(file => {
                            const type = file.type?.toLowerCase() || ''
                            return type === 'png' || type === 'jpg' || type === 'jpeg' || type === 'gif' || type === 'webp'
                        })
                        if (firstImage && firstImage.keyThumbnail) {
                            setLogo(firstImage.keyThumbnail)
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to fetch files:', error)
            } finally {
                setFilesLoading(false)
            }
        }

        fetchFiles()
    }, [material?.token])

    useEffect(() => {
        setMaterialData(prev => ({...prev, title, description, logo}))
    }, [title, description, logo])

    return (
        <div className="mb-3 pt-2">
            <h4 className="text-center mb-4">Edit publication</h4>
            <div className="row mb-3">
                <div className="col-12 col-lg-5">
                    <label htmlFor="tokenDescription" className="form-label text-center w-100">
                        Main publication image:
                    </label>
                    <LogoPreview logo={logo} files={files} />
                    {!filesLoading && <ImageSelectMain files={files} logo={logo} setLogo={setLogo} />}
                </div>
                <div className="col-12 col-lg-7">
                    <div className="row g-3 mb-3">
                        <Title {...{title, setTitle, setErrorMessage}}/>
                        <Description {...{description, setDescription, setErrorMessage}} />
                    </div>
                </div>
            </div>
            <MessagesBlock error={errorMessage} />
            <div className="d-flex justify-content-end row mb-3">
                <div className="col col-6">
                    <button className="btn btn-primary w-100" onClick={() => setMaterialForm(null)}>Cancel</button>
                </div>
                <div className="col col-6">
                    <button className="btn btn-success w-100" onClick={() =>handlerSave(materialData)}>
                        Save
                    </button>
                </div>
            </div>
        </div>
    )
}
