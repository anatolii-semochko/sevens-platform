import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { Input, TextArea } from '@react/components/form-elements/Inputs'
import { getExt, isAudio, isImage, isPdf, isVideo } from '@js/utils/file'

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

const ShortDescription = ({shortDescription, setShortDescription, error, setErrorMessage}) => (
    <div className="col-12">
        <label htmlFor="tokenDescription" className="form-label">Publication short description:</label>
        <TextArea
            id={'tokenDescription'}
            placeholder={'optional'}
            maxLength={256}
            rows={4}
            value={shortDescription}
            onChange={setShortDescription}
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

const Preview = ({logo}) => {
    const width = 450
    const height = 270

    return (
        <>
            <label htmlFor="tokenDescription" className="form-label text-center w-100">Main publication image:</label>
            {logo ? (
                <div className="d-flex justify-content-center">
                    <img src={window.AppConfig.path.materials + '/' + logo} alt={logo} style={{maxHeight: height, maxWidth: width}}/>
                </div>
            ) : (
                <div className="bg-light rounded d-flex align-items-center justify-content-center" style={{width, height}}>
                    <span className="small text-muted">No main file selected</span>
                </div>
            )}
        </>
    )
}

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


export const ImageSelectMain = ({images, logo, setLogo}) => {
    if (!images || images.length < 2) return null

    const handleClick = (selectedImage) => {
        setLogo(selectedImage)
    }

    return (
        <div className="mt-3">
            <label htmlFor="imageSelect" className="form-label">Select main image:</label>
            <div className="row g-2">
                {images.map((image) => (
                    <div key={image} className="col-6 col-sm-4 col-md-3 col-lg-4 col-xl-3 mb-2">
                        <div
                            className={`border rounded p-2 position-relative transition-all ${
                                logo === image
                                    ? 'border-primary shadow-sm'
                                    : 'border-light hover:border-secondary'
                            }`}
                            onClick={() => handleClick(image)}
                            style={{
                                cursor: 'pointer',
                                minHeight: '120px'
                            }}
                            title={image}
                            onMouseEnter={(e) => {
                                if (logo !== image) {
                                    e.target.classList.add('border-secondary', 'shadow-sm')
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (logo !== image) {
                                    e.target.classList.remove('border-secondary', 'shadow-sm')
                                }
                            }}
                        >
                            {logo === image && (
                                <div className="position-absolute top-0 end-0 mt-1 me-1">
                                    <span className="badge bg-primary text-white small">Main</span>
                                </div>
                            )}
                            <div style={{ height: '80px', overflow: 'hidden' }} className="d-flex align-items-center justify-content-center">
                                <img 
                                    src={window.AppConfig.path.materials + '/' + image} 
                                    alt={image} 
                                    style={{
                                        width: "100%", 
                                        height: "100%", 
                                        objectFit: "cover"
                                    }} 
                                />
                            </div>
                            <div className="text-center mt-2">
                                <small className={`text-truncate d-block ${
                                    logo === image ? 'text-primary fw-bold' : 'text-muted'
                                }`} style={{ fontSize: '0.75rem' }}>
                                    {image}
                                </small>
                            </div>
                        </div>
                    </div>
                ))}
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

export const MaterialForm = ({materialData, setMaterialData, setErrorMessage, handlerSave}) => {
    const [title, setTitle] = useState(materialData?.title || '')
    const [shortDescription, setShortDescription] = useState(materialData?.shortDescription || '')
    const [description, setDescription] = useState(materialData?.description || '')
    const [logo, setLogo] = useState(materialData?.logo || null)

    useEffect(() => {
        setMaterialData(prev => ({...prev, title, shortDescription, description, logo}))
    }, [title, shortDescription, description, logo])

    return (
        <div className="mb-3 pt-2">
            <h4 className="text-center mb-3">Edit publication</h4>
            <div className="row mb-3">
                <div className="col-12 col-lg-5">
                    <Preview logo={logo} />
                    <ImageSelectMain images={materialData.images} logo={logo} setLogo={setLogo} />
                </div>
                <div className="col-12 col-lg-7">
                    <div className="row g-3 mb-3">
                        <Title {...{title, setTitle, setErrorMessage}}/>
                        <ShortDescription {...{shortDescription, setShortDescription, setErrorMessage}} />
                        <Description {...{description, setDescription, setErrorMessage}} />
                    </div>
                </div>
            </div>
            <div className="d-flex justify-content-end gap-2">
                <button className="btn btn-success fs-4 w-100 p-3" onClick={handlerSave}>Save</button>
            </div>
        </div>
    )
}
