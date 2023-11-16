const { fetch: origFetch } = window;
window.fetch = async (...args) => {
    const response = await origFetch(...args);
    if ((typeof args[0] === 'string' || args[0] instanceof String) 
        && (args[0].indexOf("/cm/api/sp/campaigns") > -1 && args[0].indexOf('/placements') > -1
            || args[0].indexOf("/cm/api/sp/campaigns") > -1 && args[0].indexOf('/adgroups') > -1 && args[0].indexOf('/keywords') > -1)
    ) {
        response
            .clone()
            .json() // maybe json(), text(), blob()
            .then(data => {
                window.postMessage({ type: 'fetch', data: data }, '*');
            })
            .catch(err => console.error(err));
    }
    return response;
};