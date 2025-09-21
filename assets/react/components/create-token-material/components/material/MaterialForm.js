import React, { useEffect, useState, useMemo } from 'react'
import { TextArea } from '@react/components/form-elements/Inputs'
import { ImagePreview } from '../container/Components'

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

const Preview = ({mainFile}) => {
    const width = 450
    const height = 270

    return (
        <>
            <label htmlFor="tokenDescription" className="form-label text-center w-100">Main publication image:</label>
            {mainFile ? (
                <div className="d-flex justify-content-center">
                    <ImagePreview key={mainFile.id} {...{file: mainFile, width, height}} />
                </div>
            ) : (
                <div className="bg-light rounded d-flex align-items-center justify-content-center" style={{width, height}}>
                    <span className="small text-muted">No main file selected</span>
                </div>
            )}
        </>
    )
}

export const ImageSelectMain = ({tokenFiles, setTokenFiles}) => {
    if (!tokenFiles || tokenFiles.length < 2) return null

    const handleClick = (selectedFile) => {
        setTokenFiles(prev => prev.map(file => ({
            ...file,
            main: file.id === selectedFile.id
        })))
    }

    return (
        <div className="mt-3">
            <div className="row g-2">
                {tokenFiles.map((file) => (
                    <div key={file.id} className="col-6 col-sm-4 col-md-3 col-lg-4 col-xl-3 mb-2">
                        <div
                            className={`border rounded p-2 position-relative transition-all ${
                                file.main
                                    ? 'border-primary shadow-sm'
                                    : 'border-light hover:border-secondary'
                            }`}
                            onClick={() => handleClick(file)}
                            style={{
                                cursor: 'pointer',
                                minHeight: '120px'
                            }}
                            title={file.name}
                            onMouseEnter={(e) => {
                                if (!file.main) {
                                    e.target.classList.add('border-secondary', 'shadow-sm')
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!file.main) {
                                    e.target.classList.remove('border-secondary', 'shadow-sm')
                                }
                            }}
                        >
                            {file.main && (
                                <div className="position-absolute top-0 end-0 mt-1 me-1">
                                    <span className="badge bg-primary text-white small">Main</span>
                                </div>
                            )}
                            <div style={{ height: '80px', overflow: 'hidden' }} className="d-flex align-items-center justify-content-center">
                                <ImagePreview
                                    file={file}
                                    width="100%"
                                    height="80px"
                                />
                            </div>
                            <div className="text-center mt-2">
                                <small className={`text-truncate d-block ${
                                    file.main ? 'text-primary fw-bold' : 'text-muted'
                                }`} style={{ fontSize: '0.75rem' }}>
                                    {file.name}
                                </small>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export const MaterialForm = ({materialData, setMaterialData, setErrorMessage, tokenFiles, setTokenFiles}) => {
    const [shortDescription, setShortDescription] = useState('')
    const [description, setDescription] = useState('')

    const mainFile = useMemo(() => {
        return tokenFiles?.find(file => file.main) || tokenFiles?.[0] || null
    }, [tokenFiles])

    useEffect(() => {
        setShortDescription(materialData?.shortDescription || '')
        setDescription(materialData?.description || '')
    }, [materialData])

    useEffect(() => {
        setMaterialData({shortDescription, description})
    }, [shortDescription, description])

    return (
        <div className="mb-3 pt-2">
            <h4 className="text-center mb-3">Publish material with your minted data token</h4>
            <div className="row mb-3">
                <div className="col-12 col-lg-5">
                    <Preview mainFile={mainFile} />
                    <ImageSelectMain tokenFiles={tokenFiles} setTokenFiles={setTokenFiles} />
                </div>
                <div className="col-12 col-lg-7">
                    <div className="row g-3 mb-3">
                        <ShortDescription {...{shortDescription, setShortDescription, setErrorMessage}} />
                        <Description {...{description, setDescription, setErrorMessage}} />
                    </div>
                </div>
            </div>
            <div className="d-flex justify-content-end gap-2">
                <button className="btn btn-success fs-4 w-100 p-3">Publish</button>
            </div>
        </div>
    )
}
