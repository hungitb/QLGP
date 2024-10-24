
import $Node from "../utils/JqueryNode"
import $Button from "../component/Button"
import showModal from "../utils/showModal"

import getAuthController from "../../../general/controller/auth"

export default function $Home() {
    let text = "Nguyen Van Hung"
    for (let i = 0; i < 100; i++) text += "<h1>Nguyen Van Hung</h1>"

    if (process.env.QLGP_REQUIRE_LOGIN == "true") console.log("abd")
    
    return $Node("div").addClass("container-fluid").append(
        $Button({ icon: "alarm", text: "Nguyễn Văn Hùng", type: "danger" }).on("click", () => showModal({ body: text, title: "a" })), text
    )
}
