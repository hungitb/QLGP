
import $Node from "../utils/JqueryNode";

export default function $Home() {
    return $Node("div").html(Math.random().toString())
}
