import type { ChartOptions, Plugin } from "chart.js";

/**
 * Summary donuts never draw arc callouts. An earlier build used a custom
 * `statement-slice-callouts` afterDatasetDraw plugin (d1c67e5); belt-and-suspenders
 * here disables optional datalabels plugins and omits slice label strings from data.
 */
export const ZYFN_SUPPRESS_ARC_LABELS_PLUGIN: Plugin<"doughnut"> = {
  id: "zyfn-suppress-arc-labels",
  beforeInit(chart) {
    const plugins = chart.config.options?.plugins ?? {};
    chart.config.options!.plugins = {
      ...plugins,
      legend: { ...(plugins.legend ?? {}), display: false },
      // chartjs-plugin-datalabels (if ever registered globally)
      datalabels: { display: false },
    } as ChartOptions<"doughnut">["plugins"];
  },
};

export function summary_doughnut_options(
  overrides: ChartOptions<"doughnut">,
): ChartOptions<"doughnut"> {
  return {
    ...overrides,
    plugins: {
      ...overrides.plugins,
      legend: { display: false, ...overrides.plugins?.legend },
      datalabels: { display: false },
    } as ChartOptions<"doughnut">["plugins"],
  };
}