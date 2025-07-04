import React from 'react'
import { Toaster, toast } from 'react-hot-toast'
import HelpLink from '@components/help/HelpLink'

export default class CheckToken extends React.Component {


    render() {
        return (
            <div>
                <h1>Check Token React Component</h1>

                <Toaster position="top-right" reverseOrder={false}/>
                <br/>
                <button onClick={() => toast.success('Toaster Success!')}>Показати Success</button>
                <br/>
                <button onClick={() => toast.error('Toaster Error!')}>Показати Error</button>
                <br/>
                <HelpLink name="Test" />
                <HelpLink name="Test is Absent" />
                <HelpLink name="Container files" />
            </div>
        );
    }
}
