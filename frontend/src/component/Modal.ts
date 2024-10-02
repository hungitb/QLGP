
import $Node from "../utils/JqueryNode"
import $Button from "./Button"
import type { ButtonType } from "./Button"

type ModalSize = "sm" | "lg" | "xl" | "default"

interface ModalProp {
    title: string,
    body: JQuery<HTMLElement> | string,
    size?: ModalSize,
    footerCloseBtn?: boolean,
    buttons?: { text: string, click: () => any, type?: ButtonType }[]
}

export type { ModalProp }

export default function $Modal({ title, body, footerCloseBtn = true, buttons = [], size = "default" }: ModalProp) {
    let $modal = $Node("div").addClass("modal fade").attr({ tabindex: -1 }).append(
        $Node("div").addClass("modal-dialog modal-dialog-centered modal-dialog-scrollable").addClass(size != "default" && "modal-"+size).append(
            $Node("div").addClass("modal-content").append(
                $Node("div").addClass("modal-header").append(
                    $Node("h1").addClass("modal-title fs-5").html(title),
                    $Node("button").addClass("btn-close").attr({ "data-bs-dismiss": "modal" })
                ),
                $Node("div").addClass("modal-body").append(body),
                $Node("div").addClass("modal-footer").append(
                    footerCloseBtn && $Button({ text: "Đóng", type: "secondary" }).attr({ "data-bs-dismiss": "modal" }),
                    buttons.map(({ text, click, type = "primary" }) => $Button({ text, type }).on("click", click))
                )
            )
        )
    )

    // $modal.on("hidden.bs.modal", func) not work
    $modal.get(0).addEventListener("hidden.bs.modal", function () { this.remove() })

    return $modal
}
