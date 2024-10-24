
import $ from "jquery"

export default function $Node(tag: string, attr: { [attribute: string]: string | number } = {}) {
    let attrInline = ""
    Object.keys(attr).forEach(key => {
        attrInline += ` ${key}="${attr[key]}"`
    })
    return $(`<${tag}${attrInline}></${tag}>`)
}
