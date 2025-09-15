import React from 'react'
import { getDateTimeFromDate } from '@js/utils/time'

export const ContainerFileInfo = ({container}) => !!container && (
    <div className="mb-3"><label className="form-label">Container File Info:</label>
        <div className="p-2 bg-light border rounded">
            <div className="d-flex align-items-center gap-2">
                <table className="table-sm w-auto text-start">
                    <tbody>
                    <tr>
                        <td>File name:</td>
                        <td className="ps-3"><strong>{container?.file?.name}</strong></td>
                    </tr>
                    <tr>
                        <td>File hash:</td>
                        <td className="ps-3"><strong>{container?.hash}</strong></td>
                    </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
)

export const ActionButtons = ({handlerClear}) => (
    <div className="d-flex flex-column gap-3">
        <button className="btn btn-primary w-100 p-3 mb-2" onClick={handlerClear}>
            Check another token
        </button>
        <h6 className="text-center">YOU CAN TRY ALSO:</h6>
        <div className="d-flex gap-2">
            <button className="btn btn-primary flex-fill p-2">Create your private token</button>
            <button className="btn btn-primary flex-fill p-2">Create token and publish material</button>
        </div>
    </div>
)

export const ContainerCheckMessage = ({tokenData}) => !!tokenData && (
    <div>
        {tokenData.error ? (
            <div className="alert-danger alert text-break p-4" role="alert">
                <h4 className="text-center">Check Fail !</h4>
                <p className="text-center">Your token container has been not passed the check.</p>
                <p className="text-center text-danger"><strong>Error: {tokenData.error}.</strong></p>
                <p className="text-center">Possible reasons:</p>
                <ul>
                    <li>Container is represented by different token. Try to fill different token public key.</li>
                    <li>Derived from container name or filled by you manually public key is wrong. Try to fill correct public key.</li>
                    <li>Token for this container has been not minted yet. Try to mint token.</li>
                    <li>Token for this container has been burned. You can mint the token again.</li>
                </ul>
            </div>
        ) : (
            <div className="alert-success alert text-break p-4" role="alert">
                <h4 className="text-center mb-3">Congratulations !</h4>
                <p className="text-center">
                    Your token container has been successfully checked.
                    It is saved in blockchain and represented by token:
                </p>
                <div className="d-flex justify-content-center">
                    <table className="table-sm w-auto text-start">
                        <tbody>
                        <tr>
                            <td>Token name:</td>
                            <td className="ps-3 fw-bold">{tokenData.metadata?.tokenName}</td>
                        </tr>
                        {!!tokenData.metadata?.author && (
                            <tr>
                                <td>Author:</td>
                                <td className="ps-3 fw-bold">{tokenData.metadata.author}</td>
                            </tr>
                        )}
                        {!!tokenData.metadata?.description && (
                            <tr>
                                <td>Description:</td>
                                <td className="ps-3 fw-bold">{tokenData.metadata.description}</td>
                            </tr>
                        )}
                        <tr>
                            <td>Token public key:</td>
                            <td className="ps-3 fw-bold">{tokenData.tokenPublicKey?.toString()}</td>
                        </tr>
                        <tr>
                            <td>Token hash:</td>
                            <td className="ps-3 fw-bold">{tokenData.metadata?.hash}</td>
                        </tr>
                        <tr>
                            <td>Minting time:</td>
                            <td className="ps-3 fw-bold">{getDateTimeFromDate(tokenData.mintingTime)}</td>
                        </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        )}
    </div>
)
