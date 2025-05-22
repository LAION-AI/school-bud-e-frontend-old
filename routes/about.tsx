import { aboutContent } from "../internalization/content.ts";
import Header from "../islands/Header.tsx";
import { FreshContext } from "fresh";

export default function About(ctx: FreshContext) {
  const req = ctx.req;
  const url = new URL(req.url);
  const lang = (url.searchParams.get("lang") as string !== undefined &&
      url.searchParams.get("lang") !== null
    ? url.searchParams.get("lang")
    : "de") as string;

  return (
    <div>
      <Header lang={lang} />
      <div class="px-4 py-8 mx-auto max-w-4xl">
        <h1 class="text-3xl md:text-4xl font-bold text-center mb-6">
          {aboutContent[lang]["title"]}
        </h1>
        <p class="text-md text-gray-700">
          {aboutContent[lang]["partOneOne"]}{" "}
          <a class="text-primary-600 hover:underline" href="https://laion.ai">
            LAION
          </a>{" "}
          {aboutContent[lang]["partOneTwo"]}
        </p>

        <h2 class="text-2xl font-bold mt-8 mb-4">
          {aboutContent[lang]["headingOne"]}
        </h2>
        <p class="text-md text-gray-700">
          {aboutContent[lang]["partTwoOne"]}
          <ul class="list-disc pl-5 mt-2">
            <li>
              {aboutContent[lang]["partTwoTwo"]}
            </li>
            <li>
              {aboutContent[lang]["partTwoThree"]}
            </li>
            <li>
              {aboutContent[lang]["partTwoFour"]}
            </li>
            <li>
              {aboutContent[lang]["partTwoFive"]}
            </li>
            <li>
              {aboutContent[lang]["partTwoSix"]}
            </li>
          </ul>
        </p>

        <h3 class="text-xl font-bold mt-6 mb-3">
          {aboutContent[lang]["headingTwo"]}
        </h3>
        <p class="text-md text-gray-700">
          {aboutContent[lang]["partThreeOne"]}
        </p>

        <p class="text-md text-gray-700 mt-4">
          {aboutContent[lang]["partThreeTwo"]}
        </p>

        <h3 class="text-xl font-bold mt-6 mb-3">
          {aboutContent[lang]["headingThree"]}
        </h3>
        <p class="text-md text-gray-700">
          {aboutContent[lang]["partFourOne"]}
        </p>

        <p class="mt-6">
          {aboutContent[lang]["partFourTwo"]}{" "}
          <a
            href="https://discord.com/invite/eq3cAMZtCC"
            class="text-primary-600 hover:underline"
          >
            Discord Server
          </a>{" "}
          {aboutContent[lang]["partFourThree"]}{" "}
          <a
            href="mailto:contact@laion.ai"
            class="text-primary-600 hover:underline"
          >
            contact@laion.ai
          </a>.
        </p>
      </div>
    </div>
  );
}
