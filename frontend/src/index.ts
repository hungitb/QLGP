import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap"
import "./style.scss"
import $ from "jquery"
import Router from "@daleighan/vanilla-js-router"

import $Node from "./utils/JqueryNode"
import $NavBar from "./component/NavBar"

import $Home from "./component/Home"
import $FamilyTree from "./component/FamilyTree"
import $Statistic from "./component/Statistic"
import $UpcomingEvents from "./component/UpcomingEvents"

$(document.body).append(
  $Node("main").addClass("d-flex flex-column").css({ height: '100vh', width: '100vw' }).append(
    $NavBar(),
    $Node("div").attr("id", "content").css({
      flex: 1,
      overflow: "auto"
    })
  )
)

new Router("content", {
  "/": () => $Home().get(0),
  "/family_tree": () => $FamilyTree().get(0),
  "/statistic": () => $Statistic().get(0),
  "/upcoming_events": () => $UpcomingEvents().get(0)
})
