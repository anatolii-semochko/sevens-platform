import React from 'react'
import store from '@react/store/index'
import { fetchTranslations } from '@react/api/translations'

export default class Translation extends React.Component {
    static translationsPromises = {}

    constructor(props) {
        super(props)
        const state = store.getState()
        const domain = props.domain || 'messages'
        const text = props.text

        this.state = {
            currentLocale: state.currentLocale,
            text,
            params: props.params || {},
            domain,
            translation: state.translations?.[domain]?.[text] ?? null,
        }
    }

    componentDidMount() {
        const { domain, text } = this.state
        const state = store.getState()
        const domainTranslations = state.translations[domain]

        // Translation already exists
        if (domainTranslations && domainTranslations[text]) {
            this.setState({ translation: domainTranslations[text] })
            return
        }

        // Query has not been executed
        if (!Translation.translationsPromises[domain]) {
            Translation.translationsPromises[domain] = fetchTranslations(domain)
                .then((result) => {
                    const allTranslations = { ...store.getState().translations }
                    allTranslations[domain] = result || {}

                    store.dispatch({
                        type: 'SET_TRANSLATIONS',
                        payload: allTranslations,
                    })

                    return result
                })
                .finally(() => {
                    delete Translation.translationsPromises[domain]
                })
        }

        // Update state when result has been returned
        Translation.translationsPromises[domain].then((result) => {
            this.setState({
                translation: result?.[text] ?? null,
            })
        })
    }

    render() {
        const { translation, text, params } = this.state

        let output = translation || text
        if (params && translation) {
            Object.keys(params).forEach(key => {
                output = output.replace(`{{${key}}}`, params[key])
            })
            Object.keys(params).forEach(key => {
                output = output.replace(`{{ ${key} }}`, params[key])
            })
        }

        return output
    }
}
