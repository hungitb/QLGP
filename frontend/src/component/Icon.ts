
import $Node from "../utils/JqueryNode"
import "bootstrap-icons/font/bootstrap-icons.css"

export default function $Icon({ icon, fontSize = "1rem" }: { icon: string, fontSize?: string }) {
    return $Node("i").addClass("bi-"+icon).css({ fontSize })
}
