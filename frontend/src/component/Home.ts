
import $Node from "../utils/JqueryNode"
import $Button from "./Button"

export default function $Home() {
    return $Node("div").addClass("container-fluid").append(
        $Button({ icon: "alarm", text: "Nguyễn Văn Hùng", type: "danger" })
    )
}
