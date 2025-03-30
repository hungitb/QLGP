import Vue from "vue";
import VueRouter, { RouteConfig } from "vue-router";

import AuthLayout from "@/views/AuthLayout.vue";
import LoginView from "@/views/LoginView.vue";

import LoggedInLayout from "@/views/LoggedInLayout.vue";
import HomeView from "@/views/HomeView.vue";
import FamilyTreeView from "@/views/FamilyTreeView.vue";
import UtilitiesListView from "@/views/utilities/UtilitiesListView.vue";
import UpcomingEventsView from "@/views/UpcomingEventsView.vue";
import NotFoundView from "@/views/NotFoundView.vue";
import StatisticView from "@/views/utilities/StatisticView.vue";
import BackupDataView from "@/views/utilities/BackupDataView.vue";
import LunarCalendarView from "@/views/utilities/LunarCalendarView.vue";
import RelationshipAnalyzeView from "@/views/utilities/RelationshipAnalyzeView.vue";
import ShareManagementView from "@/views/utilities/ShareManagementView.vue";

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
        path: "/upcoming_events",
        name: "upcoming_events",
        component: UpcomingEventsView,
      },
      {
        path: "/utilities",
        name: "utilities",
        component: UtilitiesListView,
        children: [
          {
            path: "statistic",
            name: "statistic",
            component: StatisticView,
          },
          {
            path: "lunar_calendar",
            name: "lunar_calendar",
            component: LunarCalendarView,
          },
          {
            path: "backup",
            name: "backup",
            component: BackupDataView,
          },
          {
            path: "relationship_analyze",
            name: "relationship_analyze",
            component: RelationshipAnalyzeView,
          },
          {
            path: "share_management",
            name: "share_management",
            component: ShareManagementView,
          },
        ],
      },
    ],
  },
  {
    path: "*",
    name: "not_found",
    component: NotFoundView,
  },
];

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes,
});

export default router;
