import { type PageProps } from "fresh";
import TestComposerIsland from "../(_islands)/TestComposerIsland.tsx";

export default function EditTest({ params }: PageProps) {
  return (
    <>
      <head>
        <title>Edit Test | School Bud-E</title>
      </head>
      <TestComposerIsland testId={params.id} />
    </>
  );
}
