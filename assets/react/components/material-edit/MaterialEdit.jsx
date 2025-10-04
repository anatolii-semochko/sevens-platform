import { useEffect, useState } from 'react'
import { MaterialForm } from '@react/components/material-edit/components/MaterialForm'


const MaterialEdit = ({material}) => {
    const [materialData, setMaterialData] = useState(material)
    const [errorMessage, setErrorMessage] = useState(null)

    console.log({material})

    const handlerSave = () => {
        console.log('Save', materialData)
    }

    return (
        <div>
            <MaterialForm {...{materialData, setMaterialData, setErrorMessage, handlerSave}} />
        </div>
    )
}

export default MaterialEdit
