
import $Node from "../utils/JqueryNode"
import $RouterLink from "../utils/RouterLink"
import $ from "jquery"

import "bootstrap-icons/icons/diagram-3-fill.svg"
import "bootstrap-icons/icons/box-arrow-left.svg"
import "bootstrap-icons/icons/pie-chart-fill.svg"
import "bootstrap-icons/icons/calendar-event-fill.svg"
import "bootstrap-icons/icons/house-door-fill.svg"

interface $NavItemProp {
  text: string;
  icon: string;
  link?: string;
}

function $NavItem({ text, icon, link = "/" }: $NavItemProp) {
  return $Node("li").addClass("nav-item").append(
    $RouterLink({ link }).addClass("nav-link").append(
      $Node("svg", {
        width: 16, height: 16, class: "bi me-2"
      }).html(`<use xlink:href="#icon-${icon}"></use>`),
      text
    )
    .on("routerLinkClicked", function () {
      const active = (link == window.location.pathname)
      $(this).toggleClass("active", active).toggleClass("link-dark", !active)
    })
    .trigger("routerLinkClicked")
  )
}

function $NavList({ items }: { items: $NavItemProp[] }) {
  return $Node("ul").addClass("nav nav-pills flex-column").append(
    items.map($NavItem)
  )
}

export default function $NavBar() {
  return $Node("nav").addClass("navbar bg-body-tertiary").append(
    $Node("div").addClass("container-fluid").append(
      $Node("button").addClass("navbar-toggler").attr({
        "type": "button",
        "data-bs-toggle": "offcanvas",
        "data-bs-target": "#offcanvasNavbar"
      }).append(
        $Node("span").addClass("navbar-toggler-icon")
      ),
      $RouterLink({ link: "/" }).addClass("navbar-brand").html("Quản lý gia phả"),
      $Node("div").addClass("offcanvas offcanvas-start").attr("id", "offcanvasNavbar").append(
        $Node("div").addClass("offcanvas-header").append(
          $Node("h5").addClass("offcanvas-title").html("Menu"),
          $Node("button").addClass("btn-close").attr({
            "type": "button",
            "data-bs-dismiss": "offcanvas"
          })
        ),
        $Node("div").addClass("offcanvas-body d-flex flex-column").append(
          $NavList({
            items: [
              { text: "Trang chủ", icon: "house-door-fill", link: "/" },
              { text: "Cây gia phả", icon: "diagram-3-fill", link: "/family_tree" },
              { text: "Thống kê", icon: "pie-chart-fill", link: "/statistic" },
              { text: "Sự kiện sắp tới", icon: "calendar-event-fill", link: "/upcoming_events" }
            ]
          }).addClass("mb-auto").on("click", function (e) {
            if (e.target == this) return
            $(this).closest("nav").find("button.navbar-toggler").trigger("click")
          }),
          $Node("hr"),
          $NavList({ items: [{ text: "Đăng xuất", icon: "box-arrow-left", link: "/api/logout" }] })
        )
      )
    )
  )
}
