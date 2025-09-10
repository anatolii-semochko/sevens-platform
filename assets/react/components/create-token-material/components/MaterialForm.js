import React, { useEffect, useState, useMemo } from 'react'
import { TextArea } from '@react/components/form-elements/Inputs'
import { ImagePreview } from './create-container/Components'

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
    const width = 350
    const height = 200

    return (
        <>
            <label htmlFor="tokenDescription" className="form-label text-center w-100">Main publication image:</label>
            {mainFile ? (
                <div className="d-flex justify-content-center">
                <ImagePreview {...{it: mainFile, width, height}} />
                </div>
            ) : (
                <div className="bg-light rounded d-flex align-items-center justify-content-center" style={{width, height}}>
                    <span className="small text-muted">No main file selected</span>
                </div>
            )}
            <div className="small text-muted text-center p-2">You can pick the main image from the files list</div>
        </>
    )
}

export const MaterialForm = ({materialData, setMaterialData, setErrorMessage, tokenFiles}) => {
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
                </div>
                <div className="col-12 col-lg-7">
                    <div className="row g-3 mb-3">
                        <ShortDescription {...{shortDescription, setShortDescription, setErrorMessage}} />
                        <Description {...{description, setDescription, setErrorMessage}} />
                    </div>
                </div>
            </div>
            <div className="d-flex justify-content-end gap-2">
                <button className="btn btn-success w-100">Save</button>
            </div>
        </div>
    )
}
