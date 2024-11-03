import Vue from "vue";
import VueRouter, { RouteConfig } from "vue-router";

import AuthLayout from "@/views/AuthLayout.vue";
import LoginView from "@/views/LoginView.vue";
import RegisterView from "@/views/RegisterView.vue";

import LoggedInLayout from "@/views/LoggedInLayout.vue";
import HomeView from "@/views/HomeView.vue";
import FamilyTreeView from "@/views/FamilyTreeView.vue";
import StatisticView from "@/views/StatisticView.vue";
import UpcomingEventsView from "@/views/UpcomingEventsView.vue";

Vue.use(VueRouter);

const routes: Array<RouteConfig> = [
  {
    path: "/auth",
    component: AuthLayout,
    children: [
      {
        path: "login",
        name: "login",
        component: LoginView,
      },
      {
        path: "register",
        name: "register",
        component: RegisterView,
      },
    ],
  },
  {
    path: "",
    component: LoggedInLayout,
    children: [
      {
        path: "/",
        name: "home",
        component: HomeView,
      },
      {
        path: "/family_tree",
        name: "family_tree",
        component: FamilyTreeView,
      },
      {
        path: "/statistic",
        name: "statistic",
        component: StatisticView,
      },
      {
        path: "/upcoming_events",
        name: "upcoming_events",
        component: UpcomingEventsView,
      },
    ],
  },
];

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes,
});

export default router;
