
export default function restAPI(path: string, data = {}, method: string = "GET") {
    method = method.toUpperCase()
    path += (method == "GET" && Object.keys(data).length != 0) ? ("?" + (new URLSearchParams(data)).toString()) : ""
    
    return fetch(path, {
        method: method,
        headers: {
            "Content-Type": "application/json"
        },
        body: method != "GET" ? JSON.stringify(data || {}) : undefined,
        
    })
    .then(res => res.json())
}
