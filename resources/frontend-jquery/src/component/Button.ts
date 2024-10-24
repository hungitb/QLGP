
import $Node from "../utils/JqueryNode"
import $Icon from "./Icon"

type ButtonType = "primary" | "light" | "danger" | "secondary" | "success" | "info" | "dark" | "warning"
type ButtonSize = "lg" | "sm" | "default"
export type { ButtonType }

export default function $Button({ text, icon, size = "default", type = "primary" }: { text: string, icon?: string, size?: ButtonSize, type?: ButtonType }) {
    let $icon = icon && $Icon({ icon })
    if ($icon) {
        // Bootstrap define
        if (size != "default") {
            const sizeMap = { sm: "0.875rem", lg: "1.25rem" }
            const marginMap = { sm: "0.4375rem", lg: "0.625rem" }
            $icon.css({
                fontSize: sizeMap[size],
                marginRight: marginMap[size]
            })
        }
        else {
            $icon.css({ marginRight: "0.5rem" })
        }
        if (["warning", "light"].includes(type)) {
            $icon.css({ color: "#212529" })
        }
    }
    
    return $Node("button").addClass("btn").addClass("btn-"+type).append(
        $icon, text
    )
}
