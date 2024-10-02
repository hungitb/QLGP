
import { Modal } from "bootstrap"

import $Modal from "../component/Modal"
import type { ModalProp } from "../component/Modal"

export default function showModal(props: ModalProp) {
    const $modal = $Modal({ ...props }).appendTo(document.body)
    new Modal($modal.get(0)).show()
    return $modal
}
