import React, { useEffect, useState } from 'react'
import TokenApi from '@react/api/tokenApi'
import MaterialClaimApi from '@react/api/materialClaimApi'
import store from '@react/store'
import { route } from '@js/router/routing-with-locale'
import { useWallet } from '@solana/wallet-adapter-react'
import { signNonce, WalletForm, WalletWrapper } from '@react/components/form-elements/WalletForm'
import { getDateFromDate } from '@js/utils/time'
import { UserAuthorization } from '@react/components/user-auth/UserAuth'
import { RepeatableQuery } from '@react/api/RepeatableQuery'
import { ButtonWithProcessing } from '@react/components/form-elements/Buttons'
import { ErrorMessageBlock } from '@react/components/info-componnents/Messages'

const tokenApi = new TokenApi()
const materialClaimApi = new MaterialClaimApi()

const MaterialClaimInner = () => {
    if (!store.getState().user) return (
        <UserAuthorization message={'To claim materials you need to log in.'}/>
    )

    const wallet = useWallet()
    const [selected, setSelected] = useState([])
    const [waitingSignature, setWaitingSignature] = useState(false)
    const [loadingTokens, setLoadingTokens] = useState(false)
    const [processing, setProcessing] = useState(false)
    const [materials, setMaterials] = useState(null)
    const [error, setError] = useState(null)

    useEffect(() => {
        setError(null)
        setMaterials(null)
        setSelected([])
        setWaitingSignature(null)
        setProcessing(null)
        if (wallet.publicKey) {
            setLoadingTokens(true)
        }
    }, [wallet.publicKey?.toString()])

    const handleTokensSuccess = async (tokens) => {
        try {
            const materialsData = await materialClaimApi.get(tokens)
            setMaterials(materialsData)
        } catch (error) {
            setError(error)
        }
    }

    const handleClaim = async () => {
        try {
            setError(null)
            setWaitingSignature(true)
            const walletSignature = await signNonce(wallet)
            setWaitingSignature(false)
            setProcessing(true)
            await materialClaimApi.post(selected, walletSignature)
            window.location.href = route('material_manage')
        } catch (error) {
            setError(error.message)
        } finally {
            setWaitingSignature(false)
            setProcessing(false)
        }
    }

    return (
        <div>
            <WalletForm operation={'claim'} waitingSignature={waitingSignature} />
            <RepeatableQuery
                apiEndpoint={(publicKey) => tokenApi.fetchTokensByWallet(publicKey)}
                params={wallet.publicKey?.toString()}
                onSuccess={handleTokensSuccess}
                onError={setError}
                processing={loadingTokens}
                setProcessing={setLoadingTokens}
                loadingMessage={'Loading data...'}
                cancelButton={false}
            />
            <MaterialsList {...{wallet, materials, selected, setSelected}} />
            <ErrorMessageBlock message={error} />
            {!!selected.length && (
                <ButtonWithProcessing
                    className={'btn-success w-100 fs-5 p-3 mb-3'}
                    label={`Claim selected materials (${selected.length})`}
                    processingLabel={waitingSignature ? 'Waiting wallet signature...' : 'Processing...'}
                    processing={waitingSignature || processing}
                    onClick={handleClaim}
                />
            )}
            <a className="btn btn-secondary w-100 px-5 mt-2 mb-3" href={Routing.generate('material_manage')}>
                Materials management
            </a>
        </div>
    )
}

const MaterialsList = ({wallet, materials, selected, setSelected}) => {
    if (!wallet.publicKey || materials === null) {
        return
    }

    if (!materials.length) return (
        <h4 className="text-center p-2">No materials to claim for this wallet.</h4>
    )

    const Status = ({status}) => status ?
        <span className="badge bg-success">Active</span> :
        <span className="badge bg-danger">Inactive</span>

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelected(materials.map(material => material.token))
        } else {
            setSelected([])
        }
    }

    const handleSelectItem = (token) => {
        setSelected(prev => {
            if (prev.includes(token)) {
                return prev.filter(t => t !== token)
            } else {
                return [...prev, token]
            }
        })
    }

    const isAllSelected = materials.length > 0 && selected.length === materials.length

    return (
        <div>
            <h4 className="text-center p-2">Found materials available to claim:</h4>
            <table className="table align-middle">
                <thead>
                <tr>
                    <th>
                        <input
                            type="checkbox"
                            checked={isAllSelected}
                            onChange={handleSelectAll}
                            className="form-check-input"
                        />
                    </th>
                    <th className="d-none d-lg-table-cell text-break small">Token</th>
                    <th>Publication</th>
                    <th>Created At</th>
                    <th>Status</th>
                </tr>
                </thead>
                <tbody>
                {materials.map((material, key) => (
                    <tr key={key}>
                        <td>
                            <input
                                type="checkbox"
                                checked={selected.includes(material.token)}
                                onChange={() => handleSelectItem(material.token)}
                                className="form-check-input"
                            />
                        </td>
                        <td className="d-none d-lg-table-cell text-break small">{material.token}</td>
                        <td>
                            <a href={route('material_page', {token: material.token})} target="_blank">
                                {material.title || <span className="text-danger">No title</span>}
                            </a>
                        </td>
                        <td>{getDateFromDate(material.createdAt)}</td>
                        <td><Status status={material.active}/></td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    )
}

const MaterialClaim = () => (
    <WalletWrapper>
        <MaterialClaimInner />
    </WalletWrapper>
)

export default MaterialClaim
