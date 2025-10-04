

const MaterialEdit = ({material}) => {

    console.log({material})

    return (
        <div>
            <h3>Edit material</h3>
            <p>Token: {material.token}</p>
            <p>Title: {material.title}</p>
            <p>Logo: {material.logo}</p>
            <p>Description: {material.description}</p>
            <p>Created at: {material.createdAt}</p>
        </div>
    )
}

export default MaterialEdit
