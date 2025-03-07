import { Head } from "$fresh/runtime.ts";
import type { Handlers, PageProps } from "$fresh/server.ts";
import LearningPathsGraph from "../../islands/LearningPathsGraph.tsx";

export const handler: Handlers = {
	GET(_request, ctx) {
		return ctx.render(null);
	},
};

export default function GraphPage({ params }: PageProps) {
	const { name } = params;
	return (
		<>
			<Head>
				<title>Graph {name} - School Bud-E</title>
			</Head>
			<LearningPathsGraph key={name} lang="en" name={name} />
		</>
	);
}
