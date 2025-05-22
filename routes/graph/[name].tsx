import type { PageProps } from "fresh";
import LearningPathsGraph from "../../islands/LearningPathsGraph.tsx";
import { Handlers } from "fresh/compat";

export const handler: Handlers = {
  GET(ctx) {
    return ctx.render(null);
  },
};

export default function GraphPage({ params }: PageProps) {
  const { name } = params;
  return (
    <>
      <head>
        <title>Graph {name} - School Bud-E</title>
      </head>
      <LearningPathsGraph key={name} lang="en" name={name} />
    </>
  );
}
