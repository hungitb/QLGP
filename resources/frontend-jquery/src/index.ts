
import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap"
import "./style.scss"
import $ from "jquery"
if (process.env.NODE_ENV == "development") window.$ = $
import Router from "@daleighan/vanilla-js-router"

import $Node from "./utils/JqueryNode"
import $NavBar from "./component/NavBar"

import $Home from "./layout/Home"
import $FamilyTree from "./layout/FamilyTree"
import $Statistic from "./layout/Statistic"
import $UpcomingEvents from "./layout/UpcomingEvents"

$(() => {
  render()
})

function render() {
  $(document.body).append(
    $NavBar(),
    $Node("div").attr("id", "content")
  )
  
  new Router("content", {
    "/": () => $Home().get(0),
    "/family_tree": () => $FamilyTree().get(0),
    "/statistic": () => $Statistic().get(0),
    "/upcoming_events": () => $UpcomingEvents().get(0)
  })
}
