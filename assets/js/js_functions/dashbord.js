const sales_chart_options = {
  series: [
    {
      name: "Digital Goods",
      data: [28, 48, 40, 19, 86, 27, 90],
    },
    {
      name: "Electronics",
      data: [65, 59, 80, 81, 56, 55, 40],
    },
  ],
  chart: {
    height: 180,
    type: "area",
    toolbar: {
      show: false,
    },
  },
  legend: {
    show: false,
  },
  colors: ["#0d6efd", "#20c997"],
  dataLabels: {
    enabled: false,
  },
  stroke: {
    curve: "smooth",
  },
  xaxis: {
    type: "datetime",
    categories: [
      "2023-01-01",
      "2023-02-01",
      "2023-03-01",
      "2023-04-01",
      "2023-05-01",
      "2023-06-01",
      "2023-07-01",
    ],
  },
  tooltip: {
    x: {
      format: "MMMM yyyy",
    },
  },
};

const sales_chart = new ApexCharts(
  document.querySelector("#sales-chart"),
  sales_chart_options
);
sales_chart.render();

//---------------------------
// - END MONTHLY SALES CHART -
//---------------------------

function createSparklineChart(selector, data) {
  const options = {
    series: [{ data }],
    chart: {
      type: "line",
      width: 150,
      height: 30,
      sparkline: {
        enabled: true,
      },
    },
    colors: ["var(--bs-primary)"],
    stroke: {
      width: 2,
    },
    tooltip: {
      fixed: {
        enabled: false,
      },
      x: {
        show: false,
      },
      y: {
        title: {
          formatter: function (seriesName) {
            return "";
          },
        },
      },
      marker: {
        show: false,
      },
    },
  };

  const chart = new ApexCharts(document.querySelector(selector), options);
  chart.render();
}

const table_sparkline_1_data = [25, 66, 41, 89, 63, 25, 44, 12, 36, 9, 54];
const table_sparkline_2_data = [12, 56, 21, 39, 73, 45, 64, 52, 36, 59, 44];
const table_sparkline_3_data = [15, 46, 21, 59, 33, 15, 34, 42, 56, 19, 64];
const table_sparkline_4_data = [30, 56, 31, 69, 43, 35, 24, 32, 46, 29, 64];
const table_sparkline_5_data = [20, 76, 51, 79, 53, 35, 54, 22, 36, 49, 64];
const table_sparkline_6_data = [5, 36, 11, 69, 23, 15, 14, 42, 26, 19, 44];
const table_sparkline_7_data = [12, 56, 21, 39, 73, 45, 64, 52, 36, 59, 74];

createSparklineChart("#table-sparkline-1", table_sparkline_1_data);
createSparklineChart("#table-sparkline-2", table_sparkline_2_data);
createSparklineChart("#table-sparkline-3", table_sparkline_3_data);
createSparklineChart("#table-sparkline-4", table_sparkline_4_data);
createSparklineChart("#table-sparkline-5", table_sparkline_5_data);
createSparklineChart("#table-sparkline-6", table_sparkline_6_data);
createSparklineChart("#table-sparkline-7", table_sparkline_7_data);

//-------------
// - PIE CHART -
//-------------

const pie_chart_options = {
  series: [700, 500, 400, 600, 300, 100],
  chart: {
    type: "donut",
  },
  labels: ["Chrome", "Edge", "FireFox", "Safari", "Opera", "IE"],
  dataLabels: {
    enabled: false,
  },
  colors: ["#0d6efd", "#20c997", "#ffc107", "#d63384", "#6f42c1", "#adb5bd"],
};

const pie_chart = new ApexCharts(
  document.querySelector("#pie-chart"),
  pie_chart_options
);
pie_chart.render();

//---------------------------
// - SALES BY CATEGORY CHART -
//---------------------------

const category_sales_options = {
  series: [
    {
      name: "Ventes Mensuelles",
      type: "column",
      data: [12430, 8750, 6320, 4890, 2820],
    },
    {
      name: "Pourcentage Total",
      type: "line",
      data: [35, 25, 18, 14, 8],
    },
  ],
  chart: {
    height: 350,
    type: "line",
    toolbar: {
      show: false,
    },
    stacked: false,
  },
  stroke: {
    width: [0, 4],
    curve: "smooth",
  },
  plotOptions: {
    bar: {
      columnWidth: "50%",
      borderRadius: 4,
      distributed: true,
    },
  },
  colors: ["#0d6efd", "#20c997", "#0dcaf0", "#ffc107", "#dc3545"],
  fill: {
    opacity: [0.85, 1],
    gradient: {
      inverseColors: false,
      shade: "light",
      type: "vertical",
      opacityFrom: 0.85,
      opacityTo: 0.55,
      stops: [0, 100, 100, 100],
    },
  },
  labels: ["Smartphones", "Laptops", "Accessories", "Wearables", "Other"],
  markers: {
    size: 5,
  },
  xaxis: {
    type: "category",
    labels: {
      rotate: -45,
      style: {
        fontSize: "12px",
      },
    },
  },
  yaxis: [
    {
      title: {
        text: "Ventes ($)",
      },
      labels: {
        formatter: function (val) {
          return "$" + val.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        },
      },
    },
    {
      opposite: true,
      title: {
        text: "Pourcentage (%)",
      },
      labels: {
        formatter: function (val) {
          return val.toFixed(0) + "%";
        },
      },
    },
  ],
  tooltip: {
    shared: true,
    intersect: false,
    y: [
      {
        formatter: function (y) {
          if (typeof y !== "undefined") {
            return "$" + y.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
          }
          return y;
        },
      },
      {
        formatter: function (y) {
          if (typeof y !== "undefined") {
            return y.toFixed(0) + "%";
          }
          return y;
        },
      },
    ],
  },
  dataLabels: {
    enabled: true,
    enabledOnSeries: [1],
    formatter: function (val) {
      return val + "%";
    },
    style: {
      fontSize: "12px",
      colors: ["#20c997"],
    },
    offsetY: -7,
  },
};

const category_sales_chart = new ApexCharts(
  document.querySelector("#sales-category-chart"),
  category_sales_options
);
category_sales_chart.render();
