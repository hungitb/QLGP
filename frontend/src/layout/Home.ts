
import $Node from "../utils/JqueryNode"
import $Button from "../component/Button"
import showModal from "../utils/showModal"

export default function $Home() {
    let text = "Nguyen Van HUng"
    for (let i = 0; i < 100; i++) text += "<h1>Nguyen Van HUng</h1>"
    
    return $Node("div").addClass("container-fluid").append(
        $Button({ icon: "alarm", text: "Nguyễn Văn Hùng", type: "danger" }).on("click", () => showModal({ body: text, title: "a" })), text
    )
}
