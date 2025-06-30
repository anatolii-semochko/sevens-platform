import React from 'react'
import { fetchHelps } from '@api/help'
import { Toaster, toast } from 'react-hot-toast'

export default class CheckToken extends React.Component {

    getHelp = async () => {
        fetchHelps({
            help: ['Create material', 'Data container', 'Test'],
        }).then(res => console.log({res: res.json()}))
    }

    render() {
        return (
            <div>
                <h1>Check Token React Component</h1>


                {/*https://react-hot-toast.com/*/}
                <Toaster position="top-right" reverseOrder={false}/>
                <br/>
                <button onClick={() => toast.success('Toaster Success!')}>Показати Success</button>
                <br/>
                <button onClick={() => toast.error('Toaster Error!')}>Показати Error</button>
                <br/>
                <button onClick={() => this.getHelp()}>Get Help</button>
            </div>
        );
    }
}
