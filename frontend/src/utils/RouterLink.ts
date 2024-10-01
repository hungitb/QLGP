
import $Node from "./JqueryNode"
import $ from "jquery"

export default function RouterLink({ link }: { link: string }) {
    function handleLinkClick(e: any) {
        e.preventDefault()
        if (window.location.pathname == link) {
          e.stopPropagation()
          return
        }
        window.router.goTo(link)
        $("a").trigger("routerLinkClicked")
    }

    return $Node("a").attr("href", link).on("click", handleLinkClick)
}
