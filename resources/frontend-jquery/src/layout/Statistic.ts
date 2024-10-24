
import $Node from "../utils/JqueryNode";

export default function $Statistic() {
    return $Node("div").html(Math.random().toString())
}
