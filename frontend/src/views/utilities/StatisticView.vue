<template>
  <div :style="isLoading ? { height: 'calc(100vh - 300px)' } : {}">
    <FullViewLoading :floating="false" v-if="isLoading" />
    <v-row v-else>
      <v-col>
        <v-row style="min-height: 300px">
          <v-col cols="5">
            <Bar :data="dataGender" :options="chartGenderOptions" />
          </v-col>
          <v-col cols="7">
            <Bar :data="dataStatus" :options="chartStatusOptions" />
          </v-col>
        </v-row>
      </v-col>
      <v-col cols="12">
        <Bar
          :data="dataAgesOfLiving"
          :options="chartAgesOfLivingOptions"
          style="min-height: 300px"
        />
      </v-col>
      <v-col cols="12">
        <Bar
          :data="dataAgesOfDeceased"
          :options="chartAgesOfDeceasedOptions"
          style="min-height: 300px"
        />
      </v-col>
      <v-col cols="12">
        <Bar
          :data="dataBirthYears"
          :options="chartBirthYearsOptions"
          style="min-height: 300px"
        />
      </v-col>
      <v-col cols="12">
        <Bar
          :data="dataDeathYears"
          :options="chartDeathYearsOptions"
          style="min-height: 300px"
        />
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { Doughnut, Bar, Line } from "vue-chartjs";
import {
  Chart as ChartJS,
  Title,
  ArcElement,
  Tooltip,
  Legend,
  BarElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
} from "chart.js";

ChartJS.register(
  Title,
  ArcElement,
  Tooltip,
  Legend,
  BarElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale
);

import { personApi } from "@/api/person";
import FullViewLoading from "@/components/FullViewLoading.vue";
import { Gender, LifeStatus } from "../../../../backend/src/model/Person";

function getSampleData({
  arrayBackgroundColor = false,
  pointRadius = false,
} = {}) {
  return {
    labels: ["January", "February", "March"],
    datasets: [
      {
        label: "Data One",
        backgroundColor: arrayBackgroundColor
          ? ["#f87979", "#f87979", "#f87979"]
          : "#f87979",
        data: [40, 20, 12],
        ...(pointRadius
          ? { pointRadius: (context: any) => (context ? 0 : 5) }
          : {}),
      },
    ],
  };
}

function getOptions({
  title,
  scale = true,
  xTitle = "",
  yTitle = "",
}: {
  title: string;
  scale?: boolean;
  xTitle?: string;
  yTitle?: string;
}) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: title,
        font: {
          size: 18,
        },
        padding: {
          top: 10,
          bottom: 10,
        },
      },
      legend: {
        display: false, // Hide legend labels
      },
    },
    ...(scale
      ? {
          scales: {
            x: {
              ticks: {
                // callback: function (value: any, index: any) {
                //   // Lấy dataset đầu tiên
                //   const dataset = (this as any).chart.data.datasets[0].data;
                //   // Chỉ hiển thị nhãn nếu giá trị tương ứng > 0
                //   return dataset[index] > 0
                //     ? (this as any).getLabelForValue(value)
                //     : "";
                // },
              },
              ...(xTitle
                ? {
                    title: {
                      display: true,
                      text: xTitle,
                    },
                  }
                : {}),
            },
            y: {
              beginAtZero: true,
              ticks: {
                // Sử dụng callback để định dạng các giá trị trên trục Y
                callback: function (value: any) {
                  return value == Math.round(value) ? value : ""; // Chỉ hiển thị giá trị nguyên, ẩn thập phân
                },
              },
              suggestedMax: 0,
              ...(yTitle
                ? {
                    title: {
                      display: true,
                      text: yTitle,
                    },
                  }
                : {}),
            },
          },
        }
      : {}),
  };
}

function assignMaxYValue(data: any, option: any) {
  if (option.scales.y) {
    const v = data.datasets.reduce((r: any, ds: any) => {
      if (
        Array.isArray(ds.data) &&
        ds.data.every((i: any) => typeof i == "number")
      ) {
        return Math.max(r, ...ds.data);
      }
      return 10e10;
    }, -1);
    if (v != 10e10) {
      option.scales.y.suggestedMax = v + 1;
    }
  }
}

function getMaxKey(obj: Record<string, any> | null | undefined, min: number) {
  if (!obj) return min;
  return Math.max(min, ...Object.keys(obj).map((s) => parseInt(s)));
}

function getMinKey(obj: Record<string, any> | null | undefined, max: number) {
  if (!obj) return max;
  return Math.min(max, ...Object.keys(obj).map((s) => parseInt(s)));
}

function getArray(start: number, end: number) {
  const res: string[] = [];
  for (let i = start; i <= end; i++) {
    res.push(i.toString());
  }
  return res;
}

export default defineComponent({
  components: {
    FullViewLoading,
    // Doughnut,
    Bar,
    // LineChart: Line,
  },
  data() {
    return {
      isLoading: true,
      dataGender: getSampleData(),
      chartGenderOptions: getOptions({ title: "Giới tính" }),
      dataStatus: getSampleData(),
      chartStatusOptions: getOptions({ title: "Trạng thái" }),
      dataAgesOfLiving: getSampleData(),
      chartAgesOfLivingOptions: getOptions({
        title: "Tuổi của những người còn sống",
      }),
      dataAgesOfDeceased: getSampleData(),
      chartAgesOfDeceasedOptions: getOptions({
        title: "Tuổi của những người đã mất",
      }),
      dataBirthYears: getSampleData(),
      chartBirthYearsOptions: getOptions({ title: "Năm sinh của mọi người" }),
      dataDeathYears: getSampleData(),
      chartDeathYearsOptions: getOptions({ title: "Năm mất của người đã mất" }),
    };
  },
  async mounted() {
    const { data } = await personApi.statistic();
    this.isLoading = false;

    this.dataGender = {
      labels: ["Nam", "Nữ"],
      datasets: [
        {
          label: "",
          data: [Gender.MALE, Gender.FEMALE].map((k) => {
            if (!data.gender) return 0;
            return data.gender[k as Gender.MALE | Gender.FEMALE];
          }),
          backgroundColor: ["#1976d2", "#e91e63"],
        },
      ],
    };
    assignMaxYValue(this.dataGender, this.chartGenderOptions);

    this.dataStatus = {
      labels: ["Còn sống", "Đã mất", "Không rõ"],
      datasets: [
        {
          label: "Số người",
          data: [LifeStatus.ALIVE, LifeStatus.DEAD, "unknown"].map((k) => {
            if (!data.status) return 0;
            return data.status[
              k as LifeStatus.ALIVE | LifeStatus.DEAD | "unknown"
            ];
          }),
          backgroundColor: ["lightgreen", "rgb(255, 99, 132)", "darkgray"],
        },
      ],
    };
    assignMaxYValue(this.dataStatus, this.chartStatusOptions);

    const arrayAgesOfLiving = getArray(0, getMaxKey(data.agesOfLiving, 80));
    this.dataAgesOfLiving = {
      labels: arrayAgesOfLiving,
      datasets: [
        {
          label: "Số người",
          backgroundColor: "lightgreen",
          data: arrayAgesOfLiving.map((k) => {
            if (!data.agesOfLiving) return 0;
            return data.agesOfLiving[k] || 0;
          }),
        },
      ],
    };
    assignMaxYValue(this.dataAgesOfLiving, this.chartAgesOfLivingOptions);

    const arrayAgesOfDeceased = getArray(0, getMaxKey(data.agesOfDeceased, 80));
    this.dataAgesOfDeceased = {
      labels: arrayAgesOfDeceased,
      datasets: [
        {
          label: "Số người",
          backgroundColor: "#f87979",
          data: arrayAgesOfDeceased.map((k) => {
            if (!data.agesOfDeceased) return 0;
            return data.agesOfDeceased[k] || 0;
          }),
          pointRadius: function (context) {
            const value = context.dataset.data[context.dataIndex];
            return value === 0 ? 0 : 5; // Ẩn các điểm có giá trị bằng 0
          },
        },
      ],
    };
    assignMaxYValue(this.dataAgesOfDeceased, this.chartAgesOfDeceasedOptions);

    const arrayBirthYears = getArray(
      getMinKey(data.birthYears, new Date().getFullYear() - 70),
      getMaxKey(data.birthYears, new Date().getFullYear() + 1)
    );
    this.dataBirthYears = {
      labels: arrayBirthYears,
      datasets: [
        {
          label: "Số người",
          backgroundColor: "lightgreen",
          data: arrayBirthYears.map((k) => {
            if (!data.birthYears) return 0;
            return data.birthYears[k] || 0;
          }),
        },
      ],
    };
    assignMaxYValue(this.dataBirthYears, this.chartBirthYearsOptions);

    const arrayDeathYears = getArray(
      getMinKey(data.deathYears, new Date().getFullYear() - 70),
      getMaxKey(data.deathYears, new Date().getFullYear() + 1)
    );
    this.dataDeathYears = {
      labels: arrayDeathYears,
      datasets: [
        {
          label: "Số người",
          backgroundColor: "#f87979",
          data: arrayDeathYears.map((k) => {
            if (!data.deathYears) return 0;
            return data.deathYears[k] || 0;
          }),
        },
      ],
    };
    assignMaxYValue(this.dataDeathYears, this.chartDeathYearsOptions);
  },
});
</script>
