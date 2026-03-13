import { instance } from "@viz-js/viz";

export async function renderDotToSvg(dotCode: string): Promise<string> {
  const viz = await instance();
  return viz.renderString(dotCode, { format: "svg", engine: "dot" });
}
