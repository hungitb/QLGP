
import $ from "jquery"
import $Node from "../utils/JqueryNode"
import $RouterLink from "./RouterLink"
import $Icon from "./Icon"

function $NavList({ items }: { items: { text: string, icon: string, link: string }[] }) {
  return $Node("ul").addClass("nav nav-pills flex-column").append(
    items.map(function ({ text, icon, link }) {
      return $Node("li").addClass("nav-item").append(
        $RouterLink({ link }).addClass("nav-link").append(
          $Icon({ icon }).css({ marginRight: "0.5rem" }), text
        )
        .on("routerLinkClicked", function () {
          const active = (link == window.location.pathname)
          $(this).toggleClass("active", active).toggleClass("link-dark", !active)
        })
        .trigger("routerLinkClicked")
      )
    })
  )
}

export default function $NavBar() {
  return $Node("nav").addClass("navbar bg-body-tertiary sticky-top").append(
    $Node("div").addClass("container-fluid").append(
      $Node("button").addClass("navbar-toggler").attr({
        "type": "button",
        "data-bs-toggle": "offcanvas",
        "data-bs-target": "#offcanvasNavbar"
      }).append(
        $Node("span").addClass("navbar-toggler-icon")
      ),
      $RouterLink({ link: "/" }).addClass("navbar-brand").css({ marginRight: 0 }).html("Quản lý gia phả"),
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
