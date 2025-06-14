"use client";
import GraphList from "../../../islands/GraphList.tsx";

export default function GraphListPage() {
  return (
    <>
      <head>
        <title>All Graphs - School Bud-E</title>
      </head>
      <div class="container mx-auto px-4 py-8">
        <GraphList key={Date.now()} />
      </div>
    </>
  );
}
