import store from '@store/index'
import yaml from 'js-yaml'

export const fetchTranslations = async (domain) => {
    const url = `${store.getState().translationsFolder}/${domain}.${store.getState().currentLocale}.yaml`
    try {
        const response = await fetch(url)
        return response.ok ? yaml.load(await response.text(), {}) : {}
    } catch (err) {
        console.error('Error fetching translations:', err)
        return {};
    }
}
