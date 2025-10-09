import React from 'react'
import { getDateTimeFromDate } from '@js/utils/time'
import { InnerTable } from '../../create-token-material/components/token/Components'

export const ContainerCheckMessage = ({tokenData}) => !!tokenData && (
    <div>
        {tokenData.error ? (
            <div className="alert-danger alert text-break p-4" role="alert">
                <h3 className="text-center">Check Fail !</h3>
                <p className="text-center">Your token container has been not passed the check.</p>
                <p className="text-center text-danger"><strong>Error: {tokenData.error}.</strong></p>
                <p className="text-center">Possible reasons:</p>
                <ul>
                    <li>Token for this container has been not minted yet. Try to mint the token.</li>
                    <li>Token for this container has been burned. You can mint the token again.</li>
                </ul>
            </div>
        ) : (
            <div className="alert-success alert text-break p-4" role="alert">
                <h3 className="text-center mb-3">Congratulations !</h3>
                <p className="text-center">
                    Your token container has been successfully checked.
                    It is saved in blockchain and represented by token:
                </p>
                <div className="d-flex justify-content-center">
                    <InnerTable data={[
                        ['Token name', tokenData.metadata?.tokenName],
                        ['Author', tokenData.metadata?.author],
                        ['Description', tokenData.metadata?.description],
                        ['Token public key', tokenData.tokenPublicKey?.toString()],
                        ['Token hash', tokenData.metadata?.hash],
                        ['Minting time', getDateTimeFromDate(tokenData.mintingTime)],
                     ]} />
                </div>
            </div>
        )}
    </div>
)

export const ActionButtons = ({handlerClear}) => (
    <div className="d-flex flex-column gap-3 mt-4 mb-4">
        <button className="btn btn-primary fs-4 w-100 p-3 mb-2" onClick={handlerClear}>
            Check another token
        </button>
        <h6 className="text-center">YOU CAN TRY ALSO:</h6>
        <div className="row">
            <div className="col-4">
                <a href={Routing.generate('create_private_token')} className="btn btn-primary w-100 p-2">
                    Create new private token
                </a>
            </div>
            <div className="col-4">
                <a href={Routing.generate('create_material_from_token')} className="btn btn-primary w-100 p-2">
                    Publish material from private token
                </a>
            </div>
            <div className="col-4">
                <a href={Routing.generate('create_token_material')} className="btn btn-primary w-100 p-2">
                    Create new token and publish material
                </a>
            </div>
        </div>
    </div>
)
