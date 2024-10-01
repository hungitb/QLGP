
export default function handleRouterLinkCLick(e?: any) {
    e?.preventDefault?.()
    if (window.location.pathname == this.href) {
      e?.stopPropagation?.()
      return
    }
    window.router.goTo(this.href)
    $("a").trigger("routerLinkClicked")
}
