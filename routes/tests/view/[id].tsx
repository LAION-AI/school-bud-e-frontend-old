import { type PageProps } from "fresh";
import TestViewIsland from "../(_islands)/TestViewIsland.tsx";

export default function TestView({ params }: PageProps) {
  return (
    <>
      <head>
        <title>Test View | School Bud-E</title>
      </head>
      <TestViewIsland testId={params.id} />
    </>
  );
}
