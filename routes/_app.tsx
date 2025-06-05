import { AppProps } from "fresh/compat";
import { Partial } from "fresh/runtime";

export default function App({ Component }: AppProps) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>School Bud-E</title>
        <link rel="stylesheet" href="/output.css" />
        <link rel="stylesheet" href="/katex.min.css" />
      </head>
      <body f-client-nav>
        <Partial name="content">
          <Component />
        </Partial>
      </body>
    </html>
  );
}
